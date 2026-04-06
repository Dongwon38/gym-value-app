import Foundation
import React
import UserNotifications

@objc(GymAssistedNotifications)
class GymAssistedNotifications: RCTEventEmitter, UNUserNotificationCenterDelegate {
  private func ensureNotificationAuthorization(
    rejecter reject: @escaping RCTPromiseRejectBlock,
    deliver: @escaping () -> Void,
  ) {
    UNUserNotificationCenter.current().getNotificationSettings { settings in
      switch settings.authorizationStatus {
      case .notDetermined:
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { ok, error in
          if let error {
            reject("E_NOTIFICATION", error.localizedDescription, error)
            return
          }
          if ok {
            deliver()
          } else {
            reject(
              "E_NOTIFICATION",
              "Notifications are off. Enable them in Settings → Gym Value → Notifications.",
              nil,
            )
          }
        }
      case .authorized, .provisional, .ephemeral:
        deliver()
      case .denied:
        reject(
          "E_NOTIFICATION",
          "Notifications are off. Enable them in Settings → Gym Value → Notifications.",
          nil,
        )
      @unknown default:
        reject("E_NOTIFICATION", "Notification permission is unavailable.", nil)
      }
    }
  }
  override init() {
    super.init()
    UNUserNotificationCenter.current().delegate = self
    registerCategories()
  }

  override static func requiresMainQueueSetup() -> Bool {
    true
  }

  override func supportedEvents() -> [String]! {
    ["AssistedNotificationAction"]
  }

  private func registerCategories() {
    let checkIn = UNNotificationCategory(
      identifier: "CHECKIN_SUGGESTION",
      actions: [
        UNNotificationAction(
          identifier: "check_in",
          title: "Check in",
          options: [.foreground],
        ),
        UNNotificationAction(
          identifier: "dismiss",
          title: "Dismiss",
          options: [],
        ),
      ],
      intentIdentifiers: [],
      options: [],
    )

    let checkOut = UNNotificationCategory(
      identifier: "CHECKOUT_SUGGESTION",
      actions: [
        UNNotificationAction(
          identifier: "check_out",
          title: "Check out",
          options: [.foreground],
        ),
        UNNotificationAction(
          identifier: "dismiss",
          title: "Dismiss",
          options: [],
        ),
      ],
      intentIdentifiers: [],
      options: [],
    )

    UNUserNotificationCenter.current().setNotificationCategories([checkIn, checkOut])
  }

  private func emitAction(
    actionId: String,
    gymId: String,
    promptId: String,
    occurredAt: String,
  ) {
    let body: [String: Any] = [
      "actionId": actionId,
      "gymId": gymId,
      "occurredAt": occurredAt,
      "promptId": promptId,
    ]
    sendEvent(withName: "AssistedNotificationAction", body: body)
  }

  @objc(showCheckInSuggestion:gymName:occurredAt:promptId:resolver:rejecter:)
  func showCheckInSuggestion(
    _ gymId: String,
    gymName: String,
    occurredAt: String,
    promptId: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock,
  ) {
    DispatchQueue.main.async {
      self.ensureNotificationAuthorization(rejecter: reject) {
        let content = UNMutableNotificationContent()
        content.title = "Near your gym"
        content.body = gymName
        content.sound = .default
        content.categoryIdentifier = "CHECKIN_SUGGESTION"
        content.userInfo = [
          "gymId": gymId,
          "promptId": promptId,
          "occurredAt": occurredAt,
        ]

        let request = UNNotificationRequest(
          identifier: promptId,
          content: content,
          trigger: nil,
        )

        UNUserNotificationCenter.current().add(request) { error in
          if let error {
            reject("E_NOTIFICATION", error.localizedDescription, error)
          } else {
            resolve(true)
          }
        }
      }
    }
  }

  @objc(showCheckOutSuggestion:gymName:occurredAt:promptId:startedAt:resolver:rejecter:)
  func showCheckOutSuggestion(
    _ gymId: String,
    gymName: String,
    occurredAt: String,
    promptId: String,
    startedAt: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock,
  ) {
    DispatchQueue.main.async {
      self.ensureNotificationAuthorization(rejecter: reject) {
        let content = UNMutableNotificationContent()
        content.title = "Left the gym?"
        content.body = "End your visit at \(gymName)"
        content.sound = .default
        content.categoryIdentifier = "CHECKOUT_SUGGESTION"
        content.userInfo = [
          "gymId": gymId,
          "promptId": promptId,
          "occurredAt": occurredAt,
          "startedAt": startedAt,
        ]

        let request = UNNotificationRequest(
          identifier: promptId,
          content: content,
          trigger: nil,
        )

        UNUserNotificationCenter.current().add(request) { error in
          if let error {
            reject("E_NOTIFICATION", error.localizedDescription, error)
          } else {
            resolve(true)
          }
        }
      }
    }
  }

  @objc(cancelByTag:resolver:rejecter:)
  func cancelByTag(
    _ tag: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter _: @escaping RCTPromiseRejectBlock,
  ) {
    DispatchQueue.main.async {
      UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [tag])
      UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: [tag])
      resolve(true)
    }
  }

  // Foreground presentation
  func userNotificationCenter(
    _: UNUserNotificationCenter,
    willPresent _: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void,
  ) {
    completionHandler([.banner, .sound])
  }

  func userNotificationCenter(
    _: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void,
  ) {
    let userInfo = response.notification.request.content.userInfo
    let gymId = userInfo["gymId"] as? String ?? ""
    let promptId = userInfo["promptId"] as? String ?? response.notification.request.identifier
    let occurredAt = userInfo["occurredAt"] as? String ?? ISO8601DateFormatter().string(from: Date())

    let rawAction = response.actionIdentifier
    let actionId: String
    switch rawAction {
    case UNNotificationDefaultActionIdentifier:
      actionId = "open_app"
    case UNNotificationDismissActionIdentifier:
      actionId = "dismiss"
    case "check_in", "check_out", "dismiss":
      actionId = rawAction
    default:
      actionId = "open_app"
    }

    emitAction(actionId: actionId, gymId: gymId, promptId: promptId, occurredAt: occurredAt)
    completionHandler()
  }
}
