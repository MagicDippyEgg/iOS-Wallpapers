import os
from PIL import Image
import pillow_heif

pillow_heif.register_heif_opener()

def convert_heic_to_png(root_folder="."):
    changed = False

    for foldername, subfolders, filenames in os.walk(root_folder):
        for filename in filenames:
            if filename.lower().endswith(".heic"):
                heic_path = os.path.join(foldername, filename)
                png_path = os.path.splitext(heic_path)[0] + ".png"

                try:
                    print(f"Converting: {heic_path}")

                    image = Image.open(heic_path)
                    image.save(png_path, "PNG")

                    os.remove(heic_path)
                    print(f"Deleted: {heic_path}")
                    changed = True

                except Exception as e:
                    print(f"Failed: {heic_path}")
                    print(e)

    return changed


if __name__ == "__main__":
    convert_heic_to_png(".")
