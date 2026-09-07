#!/bin/bash
#
# Separa una imagen en niveles de presion de tiza y traza el contorno de cada uno.
#
#   tools/rotoscopio.sh <imagen-o-video> <carpeta-salida> [segundo]
#   node tools/tiza.mjs <carpeta-salida>/n-*.svg > assets/lacan/retrato.svg
#
# Requiere ffmpeg, potrace e ImageMagick.
#
# TIZA SOBRE PIZARRON, no carboncillo sobre papel: la tiza va donde la imagen tiene
# LUZ, no donde tiene sombra. Por eso se invierte antes de umbralizar, y asi potrace,
# que traza lo negro, traza las zonas iluminadas. Las sombras quedan en reserva:
# pizarra desnuda. Invertir esto da un negativo y el rostro se lee como una calavera.
#
# Via tonal, no de bordes: la deteccion de bordes de ffmpeg (edgedetect=canny) da
# ~130 fragmentos cortos por fotograma que, escritos con dashoffset, parecen ruido
# apareciendo en vez de un rostro trazandose.
#
# Un solo fotograma bien resuelto vale mas que doce: el movimiento viene de que el
# dibujo se escriba, no de un ciclo de rotoscopio.
#
# DERECHOS: un trazado automatico de un video ajeno es obra derivada y NO es
# publicable. Esta herramienta sirve para prototipar y para que el equipo vea el
# efecto. La version que se publica tiene que ser un dibujo propio; el encargo esta
# especificado en el plan.
#
set -euo pipefail

ORIGEN=${1:?falta la imagen o el video de origen}
SALIDA=${2:?falta la carpeta de salida}
SEGUNDO=${3:-0}
NIVELES=${NIVELES:-4}
TRABAJO=$(mktemp -d)
trap 'rm -rf "$TRABAJO"' EXIT
mkdir -p "$SALIDA"

if [[ "$ORIGEN" =~ \.(mp4|mov|mkv|webm|avi)$ ]]; then
  ffmpeg -y -loglevel error -ss "$SEGUNDO" -i "$ORIGEN" -frames:v 1 "$TRABAJO/f.png"
else
  cp "$ORIGEN" "$TRABAJO/f.png"
fi

magick "$TRABAJO/f.png" -colorspace Gray -resize 480x -blur 0x1.4 -normalize "$TRABAJO/gris.png"

# Un fondo que llega al borde produce, al umbralizar, una mancha que toca los
# limites y potrace le traza el marco rectangular. La vineta lo disuelve: el
# contorno exterior sale ovalado, que ademas es lo que le corresponde a un aura.
magick "$TRABAJO/gris.png" \
  \( +clone -fill black -colorize 100 -fill white \
     -draw "ellipse %[fx:w/2],%[fx:h/2] %[fx:w*0.50],%[fx:h*0.51] 0,360" -blur 0x16 \) \
  -compose darken -composite -negate "$TRABAJO/neg.png"

# Umbrales sobre la imagen ya invertida: el mas alto deja la mancha ancha (la masa
# iluminada, que da el contorno), el mas bajo solo los brillos (la tiza mas apretada).
UMBRALES=$(python3 -c "
n = $NIVELES
alto, bajo = 66.0, 26.0
print(' '.join('%.1f' % (alto - (alto - bajo) * i / (n - 1)) for i in range(n)))
")

i=0
for u in $UMBRALES; do
  i=$((i + 1))
  magick "$TRABAJO/neg.png" -threshold "${u}%" -depth 1 "pbm:$TRABAJO/$i.pbm"
  # -t 90 descarta las motas: sin eso el rostro queda rodeado de islas sueltas.
  potrace -s -t 90 -a 1.3 -O 1.0 -u 3 -o "$SALIDA/n-$i.svg" "$TRABAJO/$i.pbm"
  echo "nivel $i (umbral ${u}%) -> $SALIDA/n-$i.svg" >&2
done
