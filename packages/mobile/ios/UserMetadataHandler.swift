//
//  UserMetadataHandler.swift
//  Quiet
//
//  Created by Isla Koenigsknecht on 2/25/26.
//

import CoreData
import OSLog

public struct UserMetadata: Codable {
  let userId: String
  let nickname: String
  let photo: String?
}

@objc(UserMetadataHandler)
class UserMetadataHandler: NSObject {  
  private static let logger = Logger(subsystem: Bundle.main.bundleIdentifier!, category: "UserMetadataHandler")

  public func saveUserMetadata(updatedMetadata: [UserMetadata]) throws -> Void {
    UserMetadataHandler.logger.info("Storing user metadata")
  }
}
