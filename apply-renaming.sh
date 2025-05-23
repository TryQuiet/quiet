#!/bin/bash

# Comprehensive renaming script to convert "upload/uploaded" terminology to "attachment" terminology

set -e

echo "Starting comprehensive renaming from upload/uploaded terminology to attachment terminology..."

# 1. Directory renames
echo "Renaming directories..."

# Desktop directories
if [ -d "packages/desktop/src/renderer/components/Channel/File/UploadedImage" ]; then
    git mv "packages/desktop/src/renderer/components/Channel/File/UploadedImage" "packages/desktop/src/renderer/components/Channel/File/ImageAttachment"
fi

if [ -d "packages/desktop/src/renderer/components/Channel/File/UploadedImagePlaceholder" ]; then
    git mv "packages/desktop/src/renderer/components/Channel/File/UploadedImagePlaceholder" "packages/desktop/src/renderer/components/Channel/File/ImageAttachmentPlaceholder"
fi

# Mobile directories
if [ -d "packages/mobile/src/components/UploadedFile" ]; then
    git mv "packages/mobile/src/components/UploadedFile" "packages/mobile/src/components/FileAttachment"
fi

if [ -d "packages/mobile/src/components/UploadedImage" ]; then
    git mv "packages/mobile/src/components/UploadedImage" "packages/mobile/src/components/ImageAttachment"
fi

if [ -d "packages/mobile/src/components/FileUploadingPreview" ]; then
    git mv "packages/mobile/src/components/FileUploadingPreview" "packages/mobile/src/components/FileAttachmentPreview"
fi

# 2. File renames
echo "Renaming files..."

# Desktop files
if [ -f "packages/desktop/src/renderer/components/Channel/File/UploadingPreview.tsx" ]; then
    git mv "packages/desktop/src/renderer/components/Channel/File/UploadingPreview.tsx" "packages/desktop/src/renderer/components/Channel/File/FileAttachmentPreview.tsx"
fi

if [ -f "packages/mobile/src/components/ImagePreview/ImagePreview.component.tsx" ]; then
    mkdir -p "packages/mobile/src/components/ImageAttachmentPreview"
    git mv "packages/mobile/src/components/ImagePreview/ImagePreview.component.tsx" "packages/mobile/src/components/ImageAttachmentPreview/ImageAttachmentPreview.component.tsx"
    rmdir "packages/mobile/src/components/ImagePreview" 2>/dev/null || true
fi

# 3. Content substitutions
echo "Applying content substitutions..."

# Function to apply sed substitutions safely
apply_substitutions() {
    local file="$1"
    
    if [ ! -f "$file" ]; then
        return
    fi
    
    # Component and interface names
    sed -i 's/UploadedImage/ImageAttachment/g' "$file"
    sed -i 's/UploadedFile/FileAttachment/g' "$file"
    sed -i 's/UploadingPreview/FileAttachmentPreview/g' "$file"
    sed -i 's/FileUploadingPreview/FileAttachmentPreview/g' "$file"
    sed -i 's/UploadedImagePlaceholder/ImageAttachmentPlaceholder/g' "$file"
    sed -i 's/UploadedFilename/FileAttachmentname/g' "$file"
    
    # Import paths
    sed -i 's|UploadedImage/|ImageAttachment/|g' "$file"
    sed -i 's|UploadedFile/|FileAttachment/|g' "$file"
    sed -i 's|FileUploadingPreview/|FileAttachmentPreview/|g' "$file"
    sed -i 's|UploadingPreview|FileAttachmentPreview|g' "$file"
    sed -i 's|UploadedImagePlaceholder/|ImageAttachmentPlaceholder/|g' "$file"
    sed -i 's|ImagePreview/|ImageAttachmentPreview/|g' "$file"
    
    # Variable names
    sed -i 's/uploadedFileStreamIterable/fileAttachmentStreamIterable/g' "$file"
    sed -i 's/UploadedFileModal/FileAttachmentModal/g' "$file"
    
    # CSS class prefixes
    sed -i "s/PREFIX = 'UploadedImage'/PREFIX = 'ImageAttachment'/g" "$file"
    sed -i "s/PREFIX = 'UploadedFile'/PREFIX = 'FileAttachment'/g" "$file"
    
    # Test file specific substitutions
    sed -i 's/uploaded-file/file-attachment/g' "$file"
    sed -i 's/uploaded-image/image-attachment/g' "$file"
    sed -i 's/uploading-preview/file-attachment-preview/g' "$file"
    
    # Props and type names
    sed -i 's/UploadedImageProps/ImageAttachmentProps/g' "$file"
    sed -i 's/UploadedFileProps/FileAttachmentProps/g' "$file"
    sed -i 's/UploadingPreviewProps/FileAttachmentPreviewProps/g' "$file"
}

# Apply substitutions to all relevant files
echo "Applying substitutions to TypeScript/JavaScript files..."
find packages/*/src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | while read -r file; do
    apply_substitutions "$file"
done

echo "Renaming complete!"
echo "Please review the changes with 'git status' and 'git diff'"