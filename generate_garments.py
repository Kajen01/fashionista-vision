from PIL import Image, ImageDraw
import os

def create_dummy_garment(name, color, output_path):
    # Create a 400x600 transparent image
    img = Image.new('RGBA', (400, 600), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw a simple "dress" shape
    # Bodice
    draw.polygon([(100, 100), (300, 100), (320, 300), (80, 300)], fill=color)
    # Skirt
    draw.polygon([(80, 300), (320, 300), (380, 550), (20, 550)], fill=color)
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img.save(output_path)
    print(f"Created {output_path}")

create_dummy_garment("Floral Maxi Dress", (255, 105, 180, 200), "assets/garments/dress1.png")
create_dummy_garment("Summer Sundress", (135, 206, 235, 200), "assets/garments/dress2.png")
create_dummy_garment("Evening Gown", (75, 0, 130, 200), "assets/garments/dress3.png")
