#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(GymGeofence, RCTEventEmitter)

RCT_EXTERN_METHOD(addRegion:(NSString *)gymId
                  gymName:(NSString *)gymName
                  latitude:(nonnull NSNumber *)latitude
                  longitude:(nonnull NSNumber *)longitude
                  radiusMeters:(nonnull NSNumber *)radiusMeters
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(removeRegion:(NSString *)gymId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end

@interface RCT_EXTERN_MODULE(GymAssistedNotifications, RCTEventEmitter)

RCT_EXTERN_METHOD(showCheckInSuggestion:(NSString *)gymId
                  gymName:(NSString *)gymName
                  occurredAt:(NSString *)occurredAt
                  promptId:(NSString *)promptId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(showCheckOutSuggestion:(NSString *)gymId
                  gymName:(NSString *)gymName
                  occurredAt:(NSString *)occurredAt
                  promptId:(NSString *)promptId
                  startedAt:(NSString *)startedAt
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(cancelByTag:(NSString *)tag
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
