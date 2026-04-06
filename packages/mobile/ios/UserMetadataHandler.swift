//
//  UserMetadataHandler.swift
//  Quiet
//
//  Created by Isla Koenigsknecht on 2/25/26.
//

import Foundation
import CoreData
import OSLog
import SwiftData

public enum UserMetadataError: Error {
  case missingModelContext
  case noModelFound(id: String)
  case incorrectModelCount(expected: Int, actual: Int)
  case unhandledError(reason: Error)
}

public struct ProfilePhotoStruct: Codable {
  let ext: String
  let path: String?
  let size: Int
  let width: Int
  let height: Int
}

public struct UserMetadataStruct: Codable {
  let userId: String
  let nickname: String
  let profilePhoto: ProfilePhotoStruct?
}

@Model
class ProfilePhoto: Identifiable {
  var id: String
  var ext: String
  var path: String?
  var size: Int
  var width: Int
  var height: Int
  var userMetadata: UserMetadata?
  var createdAt: Date?
  
  init(id: String, ext: String, path: String?, size: Int, width: Int, height: Int, createdAt: Date?) {
    self.id = id
    self.ext = ext
    self.path = path
    self.size = size
    self.width = width
    self.height = height
    self.createdAt = createdAt
  }
  
  public static func fromStruct(id: String, profilePhoto: ProfilePhotoStruct, createdAt: Date?) -> ProfilePhoto {
    return ProfilePhoto(id: id, ext: profilePhoto.ext, path: profilePhoto.path, size: profilePhoto.size, width: profilePhoto.width, height: profilePhoto.height, createdAt: createdAt)
  }
  
  public func toStruct() -> ProfilePhotoStruct {
    return ProfilePhotoStruct(ext: self.ext, path: self.path, size: self.size, width: self.width, height: self.height)
  }
}

@Model
class UserMetadata: Identifiable {
  var id: String
  var nickname: String
  var createdAt: Date? = nil
  
  @Relationship(deleteRule: .cascade, inverse: \ProfilePhoto.userMetadata)
  var profilePhoto: ProfilePhoto?
  
  init(id: String, nickname: String, profilePhoto: ProfilePhotoStruct?, createdAt: Date?) {
    var profilePhotoModel: ProfilePhoto? = nil
    if let unwrappedProfilePhoto = profilePhoto {
      profilePhotoModel = ProfilePhoto.fromStruct(id: id, profilePhoto: unwrappedProfilePhoto, createdAt: createdAt)
    }
    
    self.id = id
    self.nickname = nickname
    self.profilePhoto = profilePhotoModel
    self.createdAt = createdAt
  }
  
  public static func fromStruct(userMetadata: UserMetadataStruct, createdAt: Date?) -> UserMetadata {
    return UserMetadata(id: userMetadata.userId, nickname: userMetadata.nickname, profilePhoto: userMetadata.profilePhoto, createdAt: createdAt)
  }
  
  public func toStruct() -> UserMetadataStruct {
    return UserMetadataStruct(
      userId: self.id,
      nickname: self.nickname,
      profilePhoto: self.profilePhoto?.toStruct()
    )
  }
}

@objc(UserMetadataHandler)
class UserMetadataHandler: NSObject {  
  private static let logger = Logger(subsystem: Bundle.main.bundleIdentifier!, category: "UserMetadataHandler")
  private var container: ModelContainer?
  private var modelContext: ModelContext?

  public func initContainer() throws -> Void {
    if (self.container != nil) {
      UserMetadataHandler.logger.debug("Container already initialized, skipping...")
      return
    }
    
    do {
      self.container = try ModelContainer(for: UserMetadata.self, configurations: .init(isStoredInMemoryOnly: false))
      self.modelContext = ModelContext(self.container!)
    } catch {
      UserMetadataHandler.logger.error("Error while initializing UserMetadata ModelContainer: \(error)")
      throw error
    }
  }

  public func saveUserMetadata(updatedMetadata: [UserMetadataStruct]) throws -> Void {
    do {
      try self.initContainer()
    } catch {
      throw error
    }
    
    guard let context = self.modelContext else {
      throw UserMetadataError.missingModelContext
    }
    
    UserMetadataHandler.logger.info("Inserting user metadata")
    for metadata in updatedMetadata {
      UserMetadataHandler.logger.debug("Inserting data for \(metadata.userId)")
      let found = try self.fetchUserMetadataById(userId: metadata.userId)
      if let unwrappedFound = found {
        UserMetadataHandler.logger.debug("Replacing existing metadata for \(metadata.userId)")
        try self.deleteUserMetadata(model: unwrappedFound)
      }
      let model = UserMetadata.fromStruct(userMetadata: metadata, createdAt: Date.now)
      context.insert(model)
    }
    
    UserMetadataHandler.logger.info("Persisting user metadata")
    do {
      try context.save()
    } catch {
      UserMetadataHandler.logger.error("Error while persisting UserMetadata model(s) to disk: \(error)")
      throw KeychainHandlerError.unhandledError(reason: error)
    }
  }
  
  public func fetchUserMetadataById(userId: String) throws -> UserMetadata? {
    UserMetadataHandler.logger.info("Fetching UserMetadata by ID: \(userId)")
    
    guard let context = self.modelContext else {
      throw UserMetadataError.missingModelContext
    }
    
    do {
      let descriptor = FetchDescriptor<UserMetadata>(
        predicate: #Predicate { $0.id == userId }
      )
      let models = try context.fetch(descriptor)
      guard models.count > 0 else {
        return nil
      }
      guard models.count == 1 else {
        UserMetadataHandler.logger.warning("Found \(models.count) stored metadata records for \(userId)")
        for model in models {
          UserMetadataHandler.logger.warning("Found \(userId) created at \(model.createdAt?.ISO8601Format() ?? "NO CREATEDAT")")
        }
        throw UserMetadataError.incorrectModelCount(expected: 1, actual: models.count)
      }
      return models[0]
    } catch {
      UserMetadataHandler.logger.error("Error while fetching UserMetadata for ID \(userId): \(error)")
      throw UserMetadataError.unhandledError(reason: error)
    }
  }
  
  public func deleteUserMetadata(model: UserMetadata) throws -> Void {
    UserMetadataHandler.logger.info("Deleting UserMetadata record for \(model.id)")
    
    guard let context = self.modelContext else {
      throw UserMetadataError.missingModelContext
    }
    
    do {
      context.delete(model)
      try context.save()
    } catch {
      UserMetadataHandler.logger.error("Error while deleting UserMetadata for \(model.id): \(error)")
      throw UserMetadataError.unhandledError(reason: error)
    }
  }

  public func clearAllUserMetadata() throws -> Void {
    do {
      try self.initContainer()
    } catch {
      throw error
    }

    guard let context = self.modelContext else {
      throw UserMetadataError.missingModelContext
    }

    do {
      let models = try context.fetch(FetchDescriptor<UserMetadata>())
      for model in models {
        context.delete(model)
      }
      try context.save()
    } catch {
      UserMetadataHandler.logger.error("Error while clearing UserMetadata: \(error)")
      throw UserMetadataError.unhandledError(reason: error)
    }
  }
}
