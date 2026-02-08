import os
import shutil
import uuid
import cv2

# ...existing code...

UPLOAD_FOLDER = os.path.join('public', 'images_input')
RESULT_FOLDER = os.path.join('public', 'result_s')

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULT_FOLDER, exist_ok=True)

# Example usage inside your route after receiving sourceImage, targetImage, and final_image:
img1_path = os.path.join(UPLOAD_FOLDER, sourceImage.filename)
img2_path = os.path.join(UPLOAD_FOLDER, targetImage.filename)

with open(img1_path, "wb") as buffer:
    shutil.copyfileobj(sourceImage.file, buffer)
with open(img2_path, "wb") as buffer:
    shutil.copyfileobj(targetImage.file, buffer)

result_filename = str(uuid.uuid4()) + '.jpg'
result_path = os.path.join(RESULT_FOLDER, result_filename)
cv2.imwrite(result_path, final_image)