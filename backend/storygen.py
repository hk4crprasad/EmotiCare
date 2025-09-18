#!/usr/bin/env python3
"""
Enhanced AI Story Generator with Image Generation - FastMCP Server

This MCP server generates customizable stories with AI-generated images using Azure OpenAI.
Supports background processing, MongoDB job tracking, and Azure Blob Storage.

Author: Assistant
Date: 2025-09-16
Version: 5.0.0 - FastMCP server with HTTP transport
"""

import json
import os
import time
import base64
import requests
import uuid
import asyncio
from datetime import datetime
from io import BytesIO
from pathlib import Path
from typing import Optional, Dict, Any

from dotenv import load_dotenv
from openai import AzureOpenAI
from PIL import Image
from pymongo import MongoClient
from azure.storage.blob import BlobServiceClient
from fastmcp import FastMCP

try:
    from weasyprint import CSS, HTML
    WEASYPRINT_AVAILABLE = True
except ImportError:
    WEASYPRINT_AVAILABLE = False


# FastMCP server initialization
mcp = FastMCP("Story Generator MCP Server")

# Global variables for database connections
mongo_client = None
mongodb = None
blob_service_client = None


def initialize_connections():
    """Initialize MongoDB and Azure Blob Storage connections."""
    global mongo_client, mongodb, blob_service_client
    
    load_dotenv()
    
    # MongoDB connection
    mongodb_url = "mongodb+srv://sih:IMIT%402025@sih.global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000"
    mongo_client = MongoClient(mongodb_url)
    mongodb = mongo_client["story_generator"]
    
    # Azure Blob Storage connection
    azure_storage_connection = "DefaultEndpointsProtocol=https;AccountName=foundertecosys2306336950;AccountKey=p58vAt9jeuKdrQgK+Hc0vsfaGmEKQvEpFYLcL9BTWABfz08mDQvkUIVayJiPNapeN8kgUuztkuZ0+AStNoq/wA==;EndpointSuffix=core.windows.net"
    blob_service_client = BlobServiceClient.from_connection_string(azure_storage_connection)
    
    print("✅ Database connections initialized")


def create_job_record(job_id: str, prompt: str, num_scenes: int) -> None:
    """Create a new job record in MongoDB."""
    job_doc = {
        "job_id": job_id,
        "prompt": prompt,
        "num_scenes": num_scenes,
        "status": "pending",
        "progress": "Initializing story generation...",
        "created_at": datetime.utcnow(),
        "completed_at": None,
        "error": None,
        "pdf_url": None
    }
    mongodb.jobs.insert_one(job_doc)


def update_job_status(job_id: str, status: str, progress: str = None, error: str = None, pdf_url: str = None) -> None:
    """Update job status in MongoDB."""
    update_data = {"status": status}
    
    if progress:
        update_data["progress"] = progress
    if error:
        update_data["error"] = error
    if pdf_url:
        update_data["pdf_url"] = pdf_url
    if status == "completed" or status == "failed":
        update_data["completed_at"] = datetime.utcnow()
    
    mongodb.jobs.update_one(
        {"job_id": job_id},
        {"$set": update_data}
    )


def get_job_status(job_id: str) -> Optional[Dict[str, Any]]:
    """Get job status from MongoDB."""
    return mongodb.jobs.find_one({"job_id": job_id}, {"_id": 0})


def upload_pdf_to_azure(pdf_path: str, job_id: str) -> str:
    """Upload PDF to Azure Blob Storage and return the URL."""
    container_name = "891457b8-459e-47dd-9d36-49b8b8227668-azureml"
    folder_prefix = "story_pdf"

    blob_name = f"{folder_prefix}/{job_id}.pdf"
    
    try:
        with open(pdf_path, "rb") as data:
            blob_service_client.get_blob_client(
                container=container_name, 
                blob=blob_name
            ).upload_blob(data, overwrite=True)
        
        # Return the blob URL
        account_name = blob_service_client.account_name
        return f"https://{account_name}.blob.core.windows.net/{container_name}/{blob_name}"
    
    except Exception as e:
        print(f"❌ Failed to upload PDF to Azure: {e}")
        raise


def download_pdf_from_azure(job_id: str) -> Optional[bytes]:
    """Download PDF from Azure Blob Storage."""
    container_name = "891457b8-459e-47dd-9d36-49b8b8227668-azureml"
    folder_prefix = "story_pdf"

    blob_name = f"{folder_prefix}/{job_id}.pdf"
    
    try:
        blob_client = blob_service_client.get_blob_client(
            container=container_name, 
            blob=blob_name
        )
        return blob_client.download_blob().readall()
    except Exception as e:
        print(f"❌ Failed to download PDF from Azure: {e}")
        return None


def setup_client():
    """
    Initialize the Azure OpenAI client with configuration from environment or .env file.

    Returns:
        AzureOpenAI: Configured Azure OpenAI client

    Raises:
        ValueError: If required configuration is not found
    """
    # Load environment variables from .env file
    load_dotenv()

    # Get Azure OpenAI configuration
    endpoint = "https://hara-md2td469-westus3.cognitiveservices.azure.com/"
    api_key = "ED8577EwFs8pfLmI8M2tusvBFaQKKy56YQDTnrhK1aIjBtZlsdv6JQQJ99BGACMsfrFXJ3w3AAAAACOGy4vI"
    gpt_deployment = "gpt-4.1"
    dalle_deployment = "gpt-image-1"

    if not endpoint or not api_key or api_key == "REPLACE_WITH_YOUR_KEY_VALUE_HERE":
        print("⚠️  Azure OpenAI configuration not found or not configured properly.")
        print("Please update the .env file with your Azure OpenAI settings:")
        print("- ENDPOINT_URL: Your Azure OpenAI endpoint")
        print("- AZURE_OPENAI_API_KEY: Your Azure OpenAI API key")
        print("- GPT_DEPLOYMENT_NAME: Your GPT-4 deployment name")
        print("- DALLE_DEPLOYMENT_NAME: Your DALL-E deployment name")
        raise ValueError("Azure OpenAI configuration is required")

    try:
        # Initialize Azure OpenAI client for text generation
        client = AzureOpenAI(
            azure_endpoint=endpoint,
            api_key=api_key,
            api_version="2025-01-01-preview",
        )
        
        print("✅ Successfully connected to Azure OpenAI API")
        return client
    except Exception as e:
        print(f"❌ Failed to initialize Azure OpenAI client: {e}")
        raise


def decode_and_save_image(b64_data: str, output_path: str) -> None:
    """
    Decode base64 image data and save it to a file.

    Args:
        b64_data (str): Base64 encoded image data
        output_path (str): Path to save the image file
    """
    image = Image.open(BytesIO(base64.b64decode(b64_data)))
    image.show()  # Show the generated image
    image.save(output_path)


def save_dalle_response(response_data: dict, output_path: str) -> bool:
    """
    Process and save images from DALL-E response.

    Args:
        response_data (dict): Response data from DALL-E API
        output_path (str): Path to save the image file

    Returns:
        bool: True if image was saved successfully, False otherwise
    """
    try:
        if 'data' in response_data and response_data['data']:
            b64_img = response_data['data'][0]['b64_json']
            decode_and_save_image(b64_img, output_path)
            print(f"✅ Image saved to: '{output_path}'")
            return True
        return False
    except Exception as e:
        print(f"❌ Failed to save image: {e}")
        return False


def generate_image_with_dalle(prompt: str, output_path: str) -> bool:
    """
    Generate an image using Azure OpenAI's DALL-E model.

    Args:
        prompt (str): Image generation prompt
        output_path (str): Path to save the generated image

    Returns:
        bool: True if image generation was successful, False otherwise
    """
    # Get configuration from environment
    endpoint = "https://hara-md2td469-westus3.cognitiveservices.azure.com/"
    deployment = "gpt-image-1"
    api_version = "2025-04-01-preview"
    subscription_key = "ED8577EwFs8pfLmI8M2tusvBFaQKKy56YQDTnrhK1aIjBtZlsdv6JQQJ99BGACMsfrFXJ3w3AAAAACOGy4vI"

    if not subscription_key:
        print("❌ Azure OpenAI API key not found in environment")
        return False

    # Prepare the API request
    base_path = f'openai/deployments/{deployment}/images'
    params = f'?api-version={api_version}'
    generation_url = f"{endpoint}{base_path}/generations{params}"

    generation_body = {
        "prompt": prompt,
        "n": 1,
        "size": "1024x1024",
        "quality": "medium",
        "output_format": "png"
    }

    try:
        # Make the API request
        generation_response = requests.post(
            generation_url,
            headers={
                'Api-Key': subscription_key,
                'Content-Type': 'application/json',
            },
            json=generation_body
        ).json()

        # Process and save the response
        return save_dalle_response(generation_response, output_path)
    except Exception as e:
        print(f"❌ Failed to generate image: {e}")
        return False


def generate_custom_story_with_images_async(job_id: str, story_prompt: str, num_scenes: int, delay_between_requests=6):
    """
    Generate a custom story with images based on user input - Background task version.

    Args:
        job_id (str): Unique job identifier
        story_prompt (str): User-defined story prompt
        num_scenes (int): Number of scenes to generate
        delay_between_requests (int): Seconds to wait between requests (rate limiting)
    """
    try:
        update_job_status(job_id, "running", "Setting up AI client...")
        
        # Setup client
        client = setup_client()
        
        # Create temporary output directory
        temp_dir = Path(f"/tmp/story_{job_id}")
        temp_dir.mkdir(parents=True, exist_ok=True)
        
        update_job_status(job_id, "running", f"Generating story with {num_scenes} scenes...")

        # Enhanced prompt for better story generation
        full_prompt = f"""
        You are an expert storyteller creating a captivating picture book.

        Create a {num_scenes}-scene story based on this idea: "{story_prompt}"

        Requirements:
        - Each scene should advance the story and be distinct
        - Include vivid, engaging descriptions suitable for illustration
        - Make it artistic, engaging, and age-appropriate
        - Focus on descriptive text that can be used to generate images
        - Keep each scene description between 2-4 sentences

        Please create exactly {num_scenes} scenes with descriptive text.
        Structure: Scene 1: [description], Scene 2: [description], etc.
        """

        print(f"🎨 Generating custom story: '{story_prompt}' for job {job_id}")

        # Get story text using GPT-4
        deployment = "gpt-4.1"
        response = client.chat.completions.create(
            model=deployment,
            messages=[{
                "role": "system",
                "content": "You are an expert storyteller creating engaging picture book stories."
            }, {
                "role": "user",
                "content": full_prompt
            }],
            max_tokens=2048,
            temperature=0.7
        )

        if not response.choices:
            raise ValueError("No response received from AI model")

        story_text = response.choices[0].message.content
        update_job_status(job_id, "running", "Story text generated, processing scenes...")

        # Parse scenes from the story
        scenes = []
        current_scene = ""
        for line in story_text.split('\n'):
            if line.strip().startswith('Scene '):
                if current_scene:
                    scenes.append(current_scene.strip())
                current_scene = line
            elif line.strip():
                current_scene += " " + line.strip()
        if current_scene:
            scenes.append(current_scene.strip())

        print(f"✨ Successfully generated {len(scenes)} story scenes for job {job_id}")
        
        # Process each scene
        story_data = {
            "job_id": job_id,
            "prompt": story_prompt,
            "num_scenes": len(scenes),
            "scenes": []
        }

        for i, scene in enumerate(scenes, 1):
            update_job_status(job_id, "running", f"Generating image for scene {i}/{len(scenes)}...")
            print(f"\n🎬 Processing Scene {i}/{len(scenes)} for job {job_id}...")
            
            # Extract scene description
            scene_text = scene.split(':', 1)[1].strip() if ':' in scene else scene.strip()
            
            # Generate image for the scene
            image_filename = f"scene_{i:02d}.png"
            image_path = temp_dir / image_filename
            
            print(f"🎨 Generating image for scene {i}...")
            
            # Generate image using DALL-E
            success = generate_image_with_dalle(
                scene_text,
                str(image_path)
            )

            if not success:
                print(f"⚠️  Failed to generate image for scene {i}")

            # Add scene data
            story_data["scenes"].append({
                "scene_number": i,
                "text": scene_text,
                "image_path": str(image_path) if success else None
            })

            # Rate limiting delay
            if i < len(scenes):
                print(f"⏱️  Waiting {delay_between_requests} seconds for rate limiting...")
                time.sleep(delay_between_requests)

        # Update story metadata
        story_data.update({
            'generated_at': datetime.now().isoformat(),
            'model': "gpt-4.1",
            'original_prompt': story_prompt
        })

        update_job_status(job_id, "running", "Creating HTML and PDF versions...")

        # Create HTML display
        html_path = create_html_display(story_data, temp_dir)
        print(f"📄 HTML story created: {html_path}")

        # Create PDF version
        pdf_path = create_pdf_from_html(html_path, temp_dir)
        if not pdf_path:
            raise Exception("Failed to generate PDF")

        print(f"� PDF story created: {pdf_path}")

        # Upload PDF to Azure Blob Storage
        update_job_status(job_id, "running", "Uploading PDF to cloud storage...")
        pdf_url = upload_pdf_to_azure(pdf_path, job_id)
        
        # Clean up temporary files
        import shutil
        shutil.rmtree(temp_dir, ignore_errors=True)

        # Mark job as completed
        update_job_status(job_id, "completed", "Story generation completed successfully!", pdf_url=pdf_url)
        print(f"✅ Job {job_id} completed successfully!")

    except Exception as e:
        error_msg = f"Story generation failed: {str(e)}"
        update_job_status(job_id, "failed", error=error_msg)
        print(f"❌ Job {job_id} failed: {error_msg}")
        
        # Clean up temporary files on error
        temp_dir = Path(f"/tmp/story_{job_id}")
        if temp_dir.exists():
            import shutil
            shutil.rmtree(temp_dir, ignore_errors=True)


def create_html_display(story_data, output_dir):
    """
    Create an HTML file to display the custom story with images.

    Args:
        story_data (dict): Story data with text and images
        output_dir (Path): Directory containing images

    Returns:
        str: Path to HTML file
    """
    html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Custom AI Story - {story_data.get('original_prompt', 'Adventure')}</title>
    <style>
        body {{
            font-family: 'Comic Sans MS', cursive, sans-serif;
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #f0f8ff, #e6e6fa, #f5deb3);
            min-height: 100vh;
        }}
        .header {{
            text-align: center;
            color: #4a4a4a;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            margin-bottom: 30px;
            background: rgba(255, 255, 255, 0.9);
            padding: 20px;
            border-radius: 15px;
            border: 3px solid #daa520;
        }}
        .story-info {{
            background: rgba(135, 206, 235, 0.9);
            border: 2px solid #4169e1;
            border-radius: 10px;
            padding: 15px;
            margin: 20px 0;
            color: #2f4f4f;
        }}
        .scene {{
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            margin: 20px 0;
            padding: 20px;
            box-shadow: 0 8px 16px rgba(0,0,0,0.2);
            border: 3px solid #daa520;
        }}
        .scene-image {{
            width: 100%;
            max-width: 600px;
            height: auto;
            border-radius: 10px;
            border: 2px solid #8b4513;
            margin: 15px 0;
            display: block;
            margin-left: auto;
            margin-right: auto;
        }}
        .scene-text {{
            font-size: 16px;
            line-height: 1.6;
            color: #2f4f4f;
            text-align: justify;
            margin: 10px 0;
        }}
        .scene-number {{
            color: #b8860b;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }}
        .generated-info {{
            text-align: center;
            font-size: 12px;
            color: #696969;
            margin-top: 30px;
            padding: 10px;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 10px;
        }}
        .debug-info {{
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid #ccc;
            border-radius: 5px;
            padding: 10px;
            margin: 10px 0;
            font-size: 12px;
            color: #666;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>🎨 Custom AI Story 🎨</h1>
        <h2>"{story_data.get('original_prompt', 'Adventure Story')}"</h2>
    </div>

    <div class="story-info">
        <h3>📖 Story Details:</h3>
        <ul>
            <li><strong>Original Prompt:</strong> {story_data.get('original_prompt', 'N/A')}</li>
            <li><strong>Scenes Requested:</strong> {story_data.get('num_scenes', 'N/A')}</li>
            <li><strong>Total Parts Generated:</strong> {story_data.get('total_parts', 'N/A')}</li>
            <li><strong>Generated:</strong> {story_data.get('generated_at', 'N/A')}</li>
            <li><strong>Model:</strong> {story_data.get('model', 'N/A')}</li>
        </ul>
    </div>
"""

    # Generate HTML for each scene
    for scene in story_data['scenes']:
        scene_num = scene['scene_number']
        html_content += '    <div class="scene">\n'
        html_content += f'        <div class="scene-number">Scene {scene_num}</div>\n'

        # Add scene text
        if scene['text']:
            # Split text into paragraphs for better formatting
            paragraphs = scene['text'].split('\n\n')
            for paragraph in paragraphs:
                if paragraph.strip():
                    # Simple markdown-style processing
                    processed_paragraph = paragraph.replace('**', '<strong>', 1).replace('**', '</strong>', 1)
                    html_content += f'        <div class="scene-text">{processed_paragraph.strip()}</div>\n'

        # Add scene image if available
        if scene['image_path']:
            image_filename = Path(scene['image_path']).name
            html_content += f'        <img src="{image_filename}" alt="Scene {scene_num}" class="scene-image">\n'

        html_content += '    </div>\n\n'

    html_content += f"""
    <div class="generated-info">
        <p>Generated on: {story_data['generated_at']}</p>
        <p>Model: {story_data['model']}</p>
        <p>Total Scenes: {story_data.get('num_scenes', 'N/A')}</p>
        <p>✨ Created with Azure OpenAI ✨</p>
    </div>
</body>
</html>
"""

    # Create safe filename
    safe_prompt = "".join(c for c in story_data.get('original_prompt', 'story')[:30] if c.isalnum() or c in (' ', '-', '_')).rstrip()
    html_filename = f"{safe_prompt.replace(' ', '_')}_story.html"
    html_path = output_dir / html_filename

    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html_content)

    return str(html_path)


def create_pdf_from_html(html_path, output_dir):
    """
    Convert HTML story to PDF for easy sharing.
    Now uses enhanced PDF generation with proper page breaks.

    Args:
        html_path (str): Path to the HTML file
        output_dir (Path): Directory to save PDF

    Returns:
        str: Path to PDF file or None if failed
    """
    if not WEASYPRINT_AVAILABLE:
        print("⚠️  WeasyPrint not available. PDF generation skipped.")
        print("   Install with: uv pip install weasyprint")
        return None

    # Import here to avoid unbound variable error
    from weasyprint import CSS, HTML

    try:
        html_file = Path(html_path)
        if not html_file.exists():
            print(f"❌ HTML file not found: {html_path}")
            return None

        # Create PDF filename
        pdf_filename = html_file.stem + '.pdf'
        pdf_path = output_dir / pdf_filename

        print(f"📄 Converting to PDF with enhanced formatting: {pdf_filename}")

        # Convert HTML to PDF with improved settings
        # Enhanced CSS for better PDF formatting
        enhanced_css = CSS(string="""
            @page {
                size: A4;
                margin: 20mm;
            }
            .scene {
                page-break-before: always;
                page-break-inside: avoid;
            }
            .scene-image {
                max-width: 100%;
                max-height: 15cm;
                page-break-inside: avoid;
            }
            body {
                font-family: 'Times New Roman', serif;
                font-size: 12pt;
                line-height: 1.4;
            }
            .header {
                page-break-after: always;
            }
            .story-info {
                page-break-after: always;
            }
            .debug-info {
                display: none;
            }
        """)

        html_doc = HTML(filename=str(html_file))
        html_doc.write_pdf(str(pdf_path), stylesheets=[enhanced_css])
        print(f"✅ Enhanced PDF created: {pdf_path}")
        print("📖 Each scene now starts on a new page for better readability")
        return str(pdf_path)

    except Exception as e:
        print(f"❌ PDF generation failed: {e}")
        print("💡 This might be due to missing system dependencies.")
        print("   On Ubuntu/Debian: sudo apt-get install libpango-1.0-0 libharfbuzz0b libcairo-gobject2")
        return None


def test_api_connection():
    """Test Azure OpenAI API connection and available models."""
    try:
        client = setup_client()

        # Test GPT model connection
        deployment = "gpt-4.1"
        test_response = client.chat.completions.create(
            model=deployment,
            messages=[{
                "role": "user",
                "content": "Say hello and confirm you're working."
            }],
            max_tokens=50
        )

        if test_response and test_response.choices:
            # Test DALL-E image generation
            temp_image = "test_image.png"
            success = generate_image_with_dalle(
                "A simple test image of a blue circle",
                temp_image
            )

            if success:
                print("✅ Azure OpenAI API connection test successful!")
                print("✅ Both GPT and DALL-E models are accessible.")
                # Clean up test image
                if os.path.exists(temp_image):
                    os.remove(temp_image)
                return True
            else:
                print("❌ GPT model working but DALL-E test failed.")
                return False
        else:
            print("❌ API test failed - no response from GPT model")
            return False

    except Exception as e:
        print(f"❌ API connection test failed: {e}")
        if "status_code=401" in str(e):
            print("🔑 Authentication failed. Please check your Azure OpenAI API key and endpoint.")
        elif "status_code=403" in str(e):
            print("⛔ Authorization failed. Please check your Azure OpenAI role assignments.")
        elif "status_code=429" in str(e):
            print("⚠️  Rate limit exceeded. Please try again later.")
        else:
            print("📝 Make sure your .env file is configured with:")
            print("- ENDPOINT_URL: Your Azure OpenAI endpoint")
            print("- AZURE_OPENAI_API_KEY: Your Azure OpenAI API key")
            print("- GPT_DEPLOYMENT_NAME: Your GPT-4 deployment name")
            print("- DALLE_DEPLOYMENT_NAME: Your DALL-E deployment name")
        return False


# FastMCP Tools
@mcp.tool
def create_story_job_mcp(prompt: str, num_scenes: int = 6) -> dict:
    """
    Create a new story generation job via MCP.
    
    Args:
        prompt: The story prompt/idea
        num_scenes: Number of scenes to generate (1-50)
    
    Returns:
        Job creation response with job_id
    """
    import uuid
    
    # Validate input
    if not prompt.strip():
        return {"error": "Story prompt cannot be empty"}
    
    if num_scenes < 1 or num_scenes > 50:
        return {"error": "Number of scenes must be between 1 and 50"}
    
    try:
        # Generate unique job ID
        job_id = str(uuid.uuid4())
        
        # Create job record in database
        create_job_record(job_id, prompt, num_scenes)
        
        # Start background task (using asyncio for MCP context)
        import asyncio
        loop = asyncio.get_event_loop()
        loop.create_task(asyncio.to_thread(
            generate_custom_story_with_images_async,
            job_id,
            prompt,
            num_scenes
        ))
        
        return {
            "success": True,
            "job_id": job_id,
            "status": "pending",
            "message": f"Story generation started. Estimated time: {num_scenes * 6 // 60}+ minutes",
            "estimated_minutes": num_scenes * 6 // 60
        }
        
    except Exception as e:
        return {"error": f"Failed to create job: {str(e)}"}


@mcp.tool
def get_job_status_mcp(job_id: str) -> dict:
    """
    Get the status of a story generation job via MCP.
    
    Args:
        job_id: Unique job identifier
    
    Returns:
        Complete job status information
    """
    job_data = get_job_status(job_id)
    
    if not job_data:
        return {"error": "Job not found"}
    
    # Add computed fields for better MCP response
    result = {
        "job_id": job_data["job_id"],
        "prompt": job_data["prompt"],
        "num_scenes": job_data["num_scenes"],
        "status": job_data["status"],
        "progress": job_data.get("progress"),
        "error": job_data.get("error"),
        "created_at": job_data["created_at"].isoformat() if job_data["created_at"] else None,
        "completed_at": job_data.get("completed_at").isoformat() if job_data.get("completed_at") else None,
        "pdf_url": job_data.get("pdf_url"),
        "is_completed": job_data["status"] == "completed",
        "is_failed": job_data["status"] == "failed",
        "is_running": job_data["status"] == "running",
        "is_pending": job_data["status"] == "pending"
    }
    
    # Add download information if completed
    if job_data["status"] == "completed" and job_data.get("pdf_url"):
        result["download_available"] = True
        result["azure_blob_url"] = job_data["pdf_url"]
    else:
        result["download_available"] = False
    
    return result


@mcp.tool
def list_recent_jobs_mcp(limit: int = 10) -> dict:
    """
    List recent story generation jobs via MCP.
    
    Args:
        limit: Maximum number of jobs to return (1-50)
    
    Returns:
        List of recent jobs with their status
    """
    if limit < 1 or limit > 50:
        return {"error": "Limit must be between 1 and 50"}
    
    try:
        jobs = list(mongodb.jobs.find(
            {},
            {"_id": 0}
        ).sort("created_at", -1).limit(limit))
        
        # Format dates for JSON serialization
        for job in jobs:
            if job.get("created_at"):
                job["created_at"] = job["created_at"].isoformat()
            if job.get("completed_at"):
                job["completed_at"] = job["completed_at"].isoformat()
        
        return {
            "success": True,
            "jobs": jobs,
            "total_returned": len(jobs),
            "total_jobs": mongodb.jobs.count_documents({})
        }
        
    except Exception as e:
        return {"error": f"Failed to list jobs: {str(e)}"}


@mcp.tool
def get_pdf_download_url_mcp(job_id: str) -> dict:
    """
    Get the PDF download URL for a completed story generation job.
    
    Args:
        job_id: Unique job identifier
    
    Returns:
        PDF download information
    """
    job_data = get_job_status(job_id)
    
    if not job_data:
        return {"error": "Job not found"}
    
    if job_data["status"] != "completed":
        return {
            "error": f"Job not completed. Current status: {job_data['status']}",
            "current_status": job_data["status"],
            "progress": job_data.get("progress")
        }
    
    if not job_data.get("pdf_url"):
        return {"error": "PDF URL not available"}
    
    return {
        "success": True,
        "job_id": job_id,
        "pdf_url": job_data["pdf_url"],
        "azure_blob_url": job_data["pdf_url"],
        "api_download_url": f"/job/{job_id}/download",
        "message": "PDF is ready for download"
    }


# FastMCP Resources
@mcp.resource("jobs://active")
def get_active_jobs() -> str:
    """
    Get a list of all active (running/pending) story generation jobs.
    """
    try:
        active_jobs = list(mongodb.jobs.find(
            {"status": {"$in": ["pending", "running"]}},
            {"_id": 0}
        ).sort("created_at", -1))
        
        # Format for text output
        if not active_jobs:
            return "No active story generation jobs currently running."
        
        result = f"Active Story Generation Jobs ({len(active_jobs)} total):\n\n"
        
        for job in active_jobs:
            created_at = job["created_at"].strftime("%Y-%m-%d %H:%M:%S") if job.get("created_at") else "Unknown"
            result += f"Job ID: {job['job_id']}\n"
            result += f"Prompt: {job['prompt'][:100]}{'...' if len(job['prompt']) > 100 else ''}\n"
            result += f"Scenes: {job['num_scenes']}\n"
            result += f"Status: {job['status']}\n"
            result += f"Progress: {job.get('progress', 'N/A')}\n"
            result += f"Created: {created_at}\n"
            result += "-" * 50 + "\n"
        
        return result
        
    except Exception as e:
        return f"Error retrieving active jobs: {str(e)}"


@mcp.resource("jobs://completed")
def get_completed_jobs() -> str:
    """
    Get a list of completed story generation jobs with PDF URLs.
    """
    try:
        completed_jobs = list(mongodb.jobs.find(
            {"status": "completed"},
            {"_id": 0}
        ).sort("completed_at", -1).limit(20))
        
        if not completed_jobs:
            return "No completed story generation jobs found."
        
        result = f"Recently Completed Story Generation Jobs ({len(completed_jobs)} shown):\n\n"
        
        for job in completed_jobs:
            completed_at = job["completed_at"].strftime("%Y-%m-%d %H:%M:%S") if job.get("completed_at") else "Unknown"
            result += f"Job ID: {job['job_id']}\n"
            result += f"Prompt: {job['prompt'][:100]}{'...' if len(job['prompt']) > 100 else ''}\n"
            result += f"Scenes: {job['num_scenes']}\n"
            result += f"Completed: {completed_at}\n"
            result += f"PDF URL: {job.get('pdf_url', 'Not available')}\n"
            result += f"Download API: /job/{job['job_id']}/download\n"
            result += "-" * 50 + "\n"
        
        return result
        
    except Exception as e:
        return f"Error retrieving completed jobs: {str(e)}"


@mcp.resource("jobs://failed")
def get_failed_jobs() -> str:
    """
    Get a list of failed story generation jobs with error details.
    """
    try:
        failed_jobs = list(mongodb.jobs.find(
            {"status": "failed"},
            {"_id": 0}
        ).sort("completed_at", -1).limit(10))
        
        if not failed_jobs:
            return "No failed story generation jobs found."
        
        result = f"Recent Failed Story Generation Jobs ({len(failed_jobs)} shown):\n\n"
        
        for job in failed_jobs:
            failed_at = job["completed_at"].strftime("%Y-%m-%d %H:%M:%S") if job.get("completed_at") else "Unknown"
            result += f"Job ID: {job['job_id']}\n"
            result += f"Prompt: {job['prompt'][:100]}{'...' if len(job['prompt']) > 100 else ''}\n"
            result += f"Scenes: {job['num_scenes']}\n"
            result += f"Failed: {failed_at}\n"
            result += f"Error: {job.get('error', 'Unknown error')}\n"
            result += "-" * 50 + "\n"
        
        return result
        
    except Exception as e:
        return f"Error retrieving failed jobs: {str(e)}"


@mcp.resource("system://stats")
def get_system_stats() -> str:
    """
    Get system statistics for the story generation service.
    """
    try:
        total_jobs = mongodb.jobs.count_documents({})
        pending_jobs = mongodb.jobs.count_documents({"status": "pending"})
        running_jobs = mongodb.jobs.count_documents({"status": "running"})
        completed_jobs = mongodb.jobs.count_documents({"status": "completed"})
        failed_jobs = mongodb.jobs.count_documents({"status": "failed"})
        
        # Get recent activity (last 24 hours)
        from datetime import timedelta
        yesterday = datetime.utcnow() - timedelta(days=1)
        recent_jobs = mongodb.jobs.count_documents({"created_at": {"$gte": yesterday}})
        
        result = f"""Story Generator System Statistics
=======================================

Total Jobs: {total_jobs}
Pending: {pending_jobs}
Running: {running_jobs}  
Completed: {completed_jobs}
Failed: {failed_jobs}

Recent Activity (24h): {recent_jobs} new jobs

Success Rate: {(completed_jobs / max(total_jobs, 1)) * 100:.1f}%
Failure Rate: {(failed_jobs / max(total_jobs, 1)) * 100:.1f}%

System Status: {'🟢 Healthy' if pending_jobs + running_jobs < 10 else '🟡 Busy' if pending_jobs + running_jobs < 20 else '🔴 Overloaded'}
"""
        return result
        
    except Exception as e:
        return f"Error retrieving system stats: {str(e)}"


def main():
    """Main function for running the FastMCP server."""
    print("⚡ FastMCP Story Generator Server Starting! ⚡")
    print("=" * 70)
    print("🎨 AI Story Generator with Image Generation")
    print("📊 MongoDB Job Tracking")
    print("☁️  Azure Blob Storage for PDFs")
    print("=" * 70)
    
    # Test connections on startup
    try:
        initialize_connections()
        print("✅ All connections initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize connections: {e}")
        return
    
    print("🔧 Starting FastMCP server on port 8001...")
    print("📚 Available MCP Tools:")
    print("  - create_story_job_mcp(prompt, num_scenes)")
    print("  - get_job_status_mcp(job_id)")
    print("  - list_recent_jobs_mcp(limit)")
    print("  - get_pdf_download_url_mcp(job_id)")
    print("📂 Available MCP Resources:")
    print("  - jobs://active")
    print("  - jobs://completed")
    print("  - jobs://failed")
    print("  - system://stats")
    print("=" * 70)
    
    # Run MCP server
    mcp.run(transport="sse", port=8001, host="0.0.0.0")


# For backward compatibility - now just calls main()
def run_mcp_only():
    """Run the FastMCP server (same as main now)."""
    main()


# For compatibility with the old CLI interface (if needed)
def run_cli_mode():
    """Legacy CLI mode - kept for backward compatibility."""
    print("🎨 Welcome to the Enhanced Custom Story Generator! 🎨")
    print("=" * 70)
    print("⚡ This script now runs as a FastMCP server!")
    print("🔧 To use the MCP server:")
    print("   1. Run: python storygen.py")
    print("   2. Connect via MCP client to: http://localhost:8001/mcp")
    print("   3. Use the available MCP tools and resources")
    print("=" * 70)
    
    main()


if __name__ == "__main__":
    import sys
    
    # Both modes now do the same thing
    main()


def run_mcp_only():
    """Run only the FastMCP server (for MCP-only deployments)."""
    print("⚡ FastMCP Story Generator Server Starting! ⚡")
    print("=" * 70)
    
    # Test connections on startup
    try:
        initialize_connections()
        print("✅ All connections initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize connections: {e}")
        return
    
    print("🔧 Starting FastMCP server on port 8001...")
    print("📚 Available MCP Tools:")
    print("  - create_story_job_mcp(prompt, num_scenes)")
    print("  - get_job_status_mcp(job_id)")
    print("  - list_recent_jobs_mcp(limit)")
    print("  - get_pdf_download_url_mcp(job_id)")
    print("📂 Available MCP Resources:")
    print("  - jobs://active")
    print("  - jobs://completed")
    print("  - jobs://failed")
    print("  - system://stats")
    print("=" * 70)
    
    # Run MCP server
    mcp.run(transport="http", port=8001, host="0.0.0.0")


# For compatibility with the old CLI interface (if needed)
def run_cli_mode():
    """Legacy CLI mode - kept for backward compatibility."""
    print("🎨 Welcome to the Enhanced Custom Story Generator! 🎨")
    print("=" * 70)
    print("� This script now runs as a FastAPI server!")
    print("� To use the API:")
    print("   1. Run: python storygen.py")
    print("   2. Visit: http://localhost:8000/docs")
    print("   3. Use the interactive API documentation")
    print("=" * 70)
    
    main()


if __name__ == "__main__":
    import sys
    
    # Check for MCP-only mode
    if len(sys.argv) > 1 and sys.argv[1] == "--mcp-only":
        run_mcp_only()
    else:
        main()
