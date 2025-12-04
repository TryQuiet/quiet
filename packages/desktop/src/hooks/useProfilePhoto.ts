import { useSelector } from 'react-redux'
import { files } from '@quiet/state-manager'
import { UserProfile, DownloadState } from '@quiet/types'

/**
 * Hook to get the appropriate profile photo source for a user
 * Handles IPFS photos, legacy base64 photos, and download states
 */
export const useProfilePhoto = (userProfile?: UserProfile) => {
  const downloadStatuses = useSelector(files.selectors.downloadStatuses)

  if (!userProfile) {
    return {
      photoSrc: null,
      isLoading: false,
      useJdenticon: true,
    }
  }

  if (userProfile.photoFile && userProfile.photoFile.cid) {
    const messageId = userProfile.photoFile.message.id
    const downloadStatus = downloadStatuses[messageId]

    if (
      downloadStatus?.downloadState === DownloadState.Queued ||
      downloadStatus?.downloadState === DownloadState.Downloading
    ) {
      return {
        photoSrc: null,
        isLoading: true,
        useJdenticon: true,
      }
    }

    if (downloadStatus?.downloadState === DownloadState.Completed && userProfile.photoFile.path) {
      const fileProtocol = 'file://'
      const photoPath = userProfile.photoFile.path.startsWith(fileProtocol)
        ? userProfile.photoFile.path
        : `${fileProtocol}${userProfile.photoFile.path}`

      return {
        photoSrc: photoPath,
        isLoading: false,
        useJdenticon: false,
      }
    }

    // IPFS photo exists but not downloaded
    return {
      photoSrc: null,
      isLoading: false,
      useJdenticon: true,
    }
  }

  // Legacy base64 photo (no IPFS photo)
  if (userProfile.photo) {
    return {
      photoSrc: userProfile.photo,
      isLoading: false,
      useJdenticon: false,
    }
  }

  // No photo at all
  return {
    photoSrc: null,
    isLoading: false,
    useJdenticon: true,
  }
}
