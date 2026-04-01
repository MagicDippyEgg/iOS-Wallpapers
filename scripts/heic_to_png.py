import os
from PIL import Image
import pillow_heif

pillow_heif.register_heif_opener()

ROOT = "."

def convert():
    for root, _, files in os.walk(ROOT):
        for file in files:
            if file.lower().endswith(".heic"):
                heic_path = os.path.join(root, file)
                png_path = os.path.splitext(heic_path)[0] + ".png"

                try:
                    print(f"Converting: {heic_path}")

                    img = Image.open(heic_path)
                    img.save(png_path, "PNG")

                    os.remove(heic_path)

                    print(f"Done: {heic_path}")

                except Exception as e:
                    print(f"Failed: {heic_path}")
                    print(e)

if __name__ == "__main__":
    convert()
