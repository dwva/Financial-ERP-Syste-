# Message Attachments Directory

This directory is used to store file attachments for messages sent between users and administrators in the Financial ERP System.

## Purpose

- Store file attachments for messages
- Provide a local storage option for message files
- Enable easy management and retrieval of message attachments

## How It Works

1. When a user or admin sends a message with a file attachment, the file is converted to base64 format and stored in the browser's sessionStorage
2. File metadata (including original name, size, type, and a unique identifier) is stored in the browser's localStorage
3. Files are referenced in messages using special URLs with the format: `localfile://{uuid}/{storedName}`
4. When users download files, the system retrieves the base64 data from sessionStorage, converts it back to a file, and triggers the download
5. In a full implementation, file metadata would be stored in actual files in this directory

## File Storage Details

Files are NOT directly stored in this directory in the browser implementation due to browser security restrictions. Instead:
- File data is stored as base64 strings in the browser's sessionStorage
- Metadata is stored in the browser's localStorage
- In a server-based implementation, files would be stored directly in this directory with metadata in JSON files

## File Naming

Files are tracked with unique identifiers to prevent naming conflicts:
- Metadata format: `{uuid}.{original-extension}`
- Storage key format: `localfile://{uuid}/{storedName}`
- Example storage key: `localfile://a1b2c3d4-e5f6-7890-abcd-ef1234567890/document.pdf`

## Security

- File data is stored in the browser's sessionStorage and is only accessible through the application
- File metadata is stored in the browser's localStorage
- Access to files is controlled through the application's authentication system
- Files are automatically cleared when the browser session ends

## Management

In the browser implementation, file management is handled through the messaging interface.
In a full server implementation, administrators would be able to:
- View all message attachments in this directory
- Download individual files
- Delete specific files
- Clear all attachments

## Future Implementation

To fully implement file storage in this directory:
1. Create server-side endpoints to handle file uploads to this directory
2. Store metadata in JSON files within this directory
3. Implement proper file access controls
4. Add cleanup mechanisms for old files

## Cleanup

It's recommended to periodically clean up this directory to free up disk space, though the actual file data is stored in browser storage rather than this directory in the current implementation.