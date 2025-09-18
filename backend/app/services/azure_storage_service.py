import os
import uuid
from datetime import datetime, timedelta
from typing import Optional, BinaryIO
from azure.storage.blob import BlobServiceClient, BlobClient, ContainerClient, generate_blob_sas, BlobSasPermissions, ContentSettings
from azure.core.exceptions import AzureError
import logging

logger = logging.getLogger(__name__)
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=foundertecosys2306336950;AccountKey=p58vAt9jeuKdrQgK+Hc0vsfaGmEKQvEpFYLcL9BTWABfz08mDQvkUIVayJiPNapeN8kgUuztkuZ0+AStNoq/wA==;EndpointSuffix=core.windows.net"
AZURE_CONTAINER_NAME="891457b8-459e-47dd-9d36-49b8b8227668-azureml"

class AzureStorageService:
    def __init__(self):
        self.connection_string = AZURE_STORAGE_CONNECTION_STRING
        self.container_name = AZURE_CONTAINER_NAME
        
        if not self.connection_string:
            raise ValueError("AZURE_STORAGE_CONNECTION_STRING environment variable not set")
        if not self.container_name:
            raise ValueError("AZURE_CONTAINER_NAME environment variable not set")
        
        self.blob_service_client = BlobServiceClient.from_connection_string(self.connection_string)
        self.container_client = self.blob_service_client.get_container_client(self.container_name)
        
        # Ensure container exists
        self._ensure_container_exists()
    
    def _ensure_container_exists(self):
        """Ensure the container exists, create if it doesn't"""
        try:
            self.container_client.get_container_properties()
        except Exception:
            try:
                self.container_client.create_container()
                logger.info(f"Created container: {self.container_name}")
            except Exception as e:
                logger.error(f"Failed to create container: {e}")
                raise
    
    def upload_file(
        self, 
        file_content, 
        filename: str, 
        content_type: str = "application/octet-stream",
        folder: str = "uploads"
    ) -> dict:
        """
        Upload a file to Azure Blob Storage
        
        Args:
            file_content: Binary file content
            filename: Original filename
            content_type: MIME type of the file
            folder: Folder/prefix for organizing files
            
        Returns:
            dict: Contains blob_name, blob_url, and other metadata
        """
        try:
            # Generate unique blob name
            file_extension = os.path.splitext(filename)[1]
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            blob_name = f"{folder}/{unique_filename}"
            
            # Get blob client
            blob_client = self.blob_service_client.get_blob_client(
                container=self.container_name, 
                blob=blob_name
            )
            
            # Handle both file objects and bytes
            if hasattr(file_content, 'read'):
                data = file_content.read()
                file_size = len(data)
            else:
                data = file_content
                file_size = len(data)
            
            # Upload file
            blob_client.upload_blob(
                data,
                overwrite=True,
                content_settings=ContentSettings(
                    content_type=content_type,
                    content_disposition=f'attachment; filename="{filename}"'
                ),
                metadata={
                    'original_filename': filename,
                    'upload_timestamp': datetime.utcnow().isoformat(),
                }
            )
            
            # Get blob URL
            blob_url = blob_client.url
            
            logger.info(f"Successfully uploaded file: {blob_name}")
            
            return {
                'blob_name': blob_name,
                'blob_url': blob_url,
                'original_filename': filename,
                'content_type': content_type,
                'size': file_size,
                'upload_timestamp': datetime.utcnow().isoformat()
            }
            
        except AzureError as e:
            logger.error(f"Azure Storage error uploading file: {e}")
            raise Exception(f"Failed to upload file to Azure Storage: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error uploading file: {e}")
            raise Exception(f"Failed to upload file: {str(e)}")
    
    def upload_resource_file(
        self, 
        file_content, 
        filename: str, 
        content_type: str = "application/octet-stream",
        resource_type: str = "general"
    ) -> dict:
        """
        Upload a resource file with specific organization
        
        Args:
            file_content: Binary file content
            filename: Original filename
            content_type: MIME type of the file
            resource_type: Type of resource (video, audio, pdf, etc.)
            
        Returns:
            dict: Contains blob_name, blob_url, and other metadata
        """
        folder = f"resources/{resource_type}"
        return self.upload_file(file_content, filename, content_type, folder)
    
    def upload_post_image(
        self, 
        file_content, 
        filename: str, 
        content_type: str = "image/jpeg"
    ) -> dict:
        """
        Upload an image for posts
        
        Args:
            file_content: Binary file content
            filename: Original filename
            content_type: MIME type of the image
            
        Returns:
            dict: Contains blob_name, blob_url, and other metadata
        """
        folder = "posts/images"
        return self.upload_file(file_content, filename, content_type, folder)
    
    def upload_avatar_image(
        self, 
        file_content, 
        filename: str, 
        content_type: str = "image/jpeg"
    ) -> dict:
        """
        Upload an avatar image
        
        Args:
            file_content: Binary file content
            filename: Original filename
            content_type: MIME type of the image
            
        Returns:
            dict: Contains blob_name, blob_url, and other metadata
        """
        folder = "avatars"
        return self.upload_file(file_content, filename, content_type, folder)
    
    def generate_download_url(
        self, 
        blob_name: str, 
        expiry_hours: int = 24
    ) -> str:
        """
        Generate a temporary download URL with SAS token
        
        Args:
            blob_name: Name of the blob
            expiry_hours: Hours until the URL expires
            
        Returns:
            str: Temporary download URL
        """
        try:
            # Generate SAS token
            sas_token = generate_blob_sas(
                account_name=self.blob_service_client.account_name,
                container_name=self.container_name,
                blob_name=blob_name,
                account_key=self.blob_service_client.credential.account_key,
                permission=BlobSasPermissions(read=True),
                expiry=datetime.utcnow() + timedelta(hours=expiry_hours)
            )
            
            # Construct URL with SAS token
            blob_client = self.blob_service_client.get_blob_client(
                container=self.container_name, 
                blob=blob_name
            )
            return f"{blob_client.url}?{sas_token}"
            
        except Exception as e:
            logger.error(f"Error generating download URL: {e}")
            raise Exception(f"Failed to generate download URL: {str(e)}")
    
    def delete_file(self, blob_name: str) -> bool:
        """
        Delete a file from Azure Blob Storage
        
        Args:
            blob_name: Name of the blob to delete
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            blob_client = self.blob_service_client.get_blob_client(
                container=self.container_name, 
                blob=blob_name
            )
            blob_client.delete_blob()
            logger.info(f"Successfully deleted blob: {blob_name}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting blob {blob_name}: {e}")
            return False
    
    def get_file_info(self, blob_name: str) -> Optional[dict]:
        """
        Get information about a file in Azure Blob Storage
        
        Args:
            blob_name: Name of the blob
            
        Returns:
            dict: File metadata or None if not found
        """
        try:
            blob_client = self.blob_service_client.get_blob_client(
                container=self.container_name, 
                blob=blob_name
            )
            properties = blob_client.get_blob_properties()
            
            return {
                'blob_name': blob_name,
                'blob_url': blob_client.url,
                'size': properties.size,
                'content_type': properties.content_settings.content_type,
                'last_modified': properties.last_modified.isoformat(),
                'metadata': properties.metadata
            }
            
        except Exception as e:
            logger.error(f"Error getting file info for {blob_name}: {e}")
            return None
    
    def list_files(self, folder_prefix: str = "") -> list:
        """
        List files in the container with optional folder prefix
        
        Args:
            folder_prefix: Folder prefix to filter files
            
        Returns:
            list: List of file information dictionaries
        """
        try:
            blob_list = self.container_client.list_blobs(name_starts_with=folder_prefix)
            files = []
            
            for blob in blob_list:
                files.append({
                    'blob_name': blob.name,
                    'size': blob.size,
                    'content_type': blob.content_settings.content_type if blob.content_settings else None,
                    'last_modified': blob.last_modified.isoformat() if blob.last_modified else None,
                    'metadata': blob.metadata
                })
            
            return files
            
        except Exception as e:
            logger.error(f"Error listing files: {e}")
            return []

# Global instance
azure_storage_service = AzureStorageService()