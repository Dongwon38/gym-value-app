import CoreLocation
import Foundation
import React

@objc(GymGeofence)
class GymGeofence: RCTEventEmitter, CLLocationManagerDelegate {
  private let locationManager = CLLocationManager()

  override init() {
    super.init()
    locationManager.delegate = self
  }

  override static func requiresMainQueueSetup() -> Bool {
    true
  }

  override func supportedEvents() -> [String]! {
    ["GeofenceTransition"]
  }

  private func clampRadiusMeters(_ radius: Double) -> CLLocationDistance {
    let minR: CLLocationDistance = 100
    let maxR = locationManager.maximumRegionMonitoringDistance
    return min(max(radius, minR), maxR)
  }

  @objc(addRegion:gymName:latitude:longitude:radiusMeters:resolver:rejecter:)
  func addRegion(
    _ gymId: String,
    gymName _: String,
    latitude: NSNumber,
    longitude: NSNumber,
    radiusMeters: NSNumber,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock,
  ) {
    DispatchQueue.main.async {
      for region in self.locationManager.monitoredRegions {
        if region.identifier == gymId {
          self.locationManager.stopMonitoring(for: region)
        }
      }

      let center = CLLocationCoordinate2D(
        latitude: latitude.doubleValue,
        longitude: longitude.doubleValue,
      )
      let radius = self.clampRadiusMeters(radiusMeters.doubleValue)

      guard CLLocationCoordinate2DIsValid(center) else {
        reject("E_GEOFENCE", "Invalid coordinates", nil)
        return
      }

      let auth = self.locationManager.authorizationStatus
      guard auth == .authorizedAlways else {
        reject(
          "E_GEOFENCE",
          "Geofencing needs Location set to Always. Open Settings → Gym Value → Location → Always.",
          nil,
        )
        return
      }

      let region = CLCircularRegion(center: center, radius: radius, identifier: gymId)
      region.notifyOnEntry = true
      region.notifyOnExit = true

      self.locationManager.startMonitoring(for: region)
      resolve(true)
    }
  }

  @objc(removeRegion:resolver:rejecter:)
  func removeRegion(
    _ gymId: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter _: @escaping RCTPromiseRejectBlock,
  ) {
    DispatchQueue.main.async {
      for region in self.locationManager.monitoredRegions {
        if region.identifier == gymId {
          self.locationManager.stopMonitoring(for: region)
        }
      }
      resolve(true)
    }
  }

  private func emitTransition(
    gymId: String,
    type: String,
    region: CLRegion,
  ) {
    let now = ISO8601DateFormatter().string(from: Date())
    var payload: [String: Any] = [
      "gymId": gymId,
      "occurredAt": now,
      "source": "platform",
      "type": type,
    ]

    if let circular = region as? CLCircularRegion {
      payload["latitude"] = circular.center.latitude
      payload["longitude"] = circular.center.longitude
      payload["radiusMeters"] = circular.radius
    } else {
      payload["latitude"] = NSNull()
      payload["longitude"] = NSNull()
      payload["radiusMeters"] = NSNull()
    }

    sendEvent(withName: "GeofenceTransition", body: payload)
  }

  func locationManager(_: CLLocationManager, didEnterRegion region: CLRegion) {
    emitTransition(gymId: region.identifier, type: "enter", region: region)
  }

  func locationManager(_: CLLocationManager, didExitRegion region: CLRegion) {
    emitTransition(gymId: region.identifier, type: "exit", region: region)
  }

  func locationManager(_: CLLocationManager, monitoringDidFailFor _: CLRegion?, withError error: Error) {
    NSLog("[GymGeofence] monitoringDidFailFor: \(error.localizedDescription)")
  }
}
