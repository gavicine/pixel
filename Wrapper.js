class GameDistributionWrapper {

    constructor(readyCallback) {
        this.readyCallback = readyCallback;
        // Advertisement fields.
        this.interstitialVisible = false;
        this.rewardedVisible = false;
        this.contentPauseRequested = false;
        // Wrapper initialization.
        console.log("Wrapper initialization started.");
        window["GD_OPTIONS"] = {
            "gameId": runtimeData.gameDistributionId,
            "prefix": runtimeData.gameDistributionPrefix,
            "advertisementSettings": {
                // Enable IMA SDK debugging.
                "debug": false,
                // Don't use this because of browser 
                // video autoplay restrictions.
                "autoplay": false,
                // Locale used in IMA SDK, this will localize
                // the "Skip ad after x seconds" phrases.
                "locale": "en",
            },
            "onEvent": (eventData) => {
                switch (eventData.name) {
                    case "SDK_READY": {
                        // When the SDK is ready.
                        console.log("SDK initialized successfully.");
                        this.readyCallback();
                        this.invokeInterstitial();
                        break;
                    }
                    case "LOADED": {
                        // Fired when ad data is available.
                        console.log("Ad is loaded.");

                        break;
                    }
                    case "CONTENT_PAUSE_REQUESTED": {
                        // Fired when content should be paused.
                        // This usually happens right before an
                        // ad is about to cover the content.
                        console.log("Content pause requested.");
                        application.publishEvent("OnExternalPause", "True");
                        this.contentPauseRequested = true;
                        break;
                    }
                    case "CONTENT_RESUME_REQUESTED": {
                        // Fired when content should be resumed.
                        // This usually happens when an ad finishes or collapses.
                        console.log("Content resume requested.");
                        application.publishEvent("OnExternalPause", "False");
                        this.contentPauseRequested = false;
                        break;
                    }
                    case "SDK_REWARDED_WATCH_COMPLETE": {
                        // This event is triggered when your
                        // user completely watched rewarded ad.
                        console.log("Rewarded ad watched successfully.");
                        application.publishEvent("OnRewardedEvent", "Success");
                        break;
                    }
                    case "SDK_ERROR": {
                        // When the SDK has hit a critical error.
                        console.error("Critical error occurred.");
                        break;
                    }
                }
            },
        };
        (function (d, s, id) {
            var js,
                fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) return;
            js = d.createElement(s);
            js.id = id;
            js.src = "/game-assets/sdk/gd/index.js";
            fjs.parentNode.insertBefore(js, fjs);
        })(document, "script", "meegames-jssdk");
    }

    // Interstitial advertisement methods.

    isInterstitialVisible() {
        return this.interstitialVisible;
    }

    invokeInterstitial() {
        console.log("Invoke interstitial called.");
        return new Promise((resolve, reject) => {
            try {
                if (!window.MeeGamesSDK || typeof MeeGamesSDK.showAd !== "function") {
                    return reject(new Error("MeeGamesSDK.showAd is not available"));
                }

                const doShow = () => {
                    this.displayInterstitial()
                        .then(resolve)
                        .catch(reject);
                };

                // Nếu SDK có hàm check ready thì xài
                if (typeof MeeGamesSDK.isInterstitialAdReady === "function" &&
                    MeeGamesSDK.isInterstitialAdReady()) {
                    console.log("Interstitial already ready.");
                    doShow();
                } else {
                    console.log("Interstitial not ready, preloading...");
                    this.preloadInterstitial()
                        .then(doShow)
                        .catch(reject);
                }
            } catch (exception) {
                console.error("Invoke interstitial failed.", exception);
                reject(exception);
            }
        });
    }


    preloadInterstitial() {
        console.log("Preload interstitial called.");
        return new Promise((resolve, reject) => {
            if (window.MeeGamesSDK && typeof MeeGamesSDK.preloadAd === "function") {
                MeeGamesSDK.preloadAd("interstitial")
                    .then(response => {
                        resolve(response);
                    })
                    .catch(exception => {
                        console.error("Preloading interstitial failed.", exception);
                        reject(exception);
                    });
            } else {
                const error = new Error("MeeGamesSDK.preloadAd is not available");
                console.error("Preloading interstitial failed.", error);
                reject(error);
            }
        });
    }


    displayInterstitial() {
        console.log("Display interstitial called.");
        return new Promise((resolve, reject) => {
            try {
                if (!window.MeeGamesSDK || typeof MeeGamesSDK.showAd !== "function") {
                    const error = new Error("MeeGamesSDK.showAd is not available");
                    console.error(error);
                    application.publishEvent("OnInterstitialEvent", "Error");
                    return reject(error);
                }

                this.interstitialVisible = true;
                application.publishEvent("OnInterstitialEvent", "Begin");

                MeeGamesSDK.showAd("interstitial")
                    .then(response => {
                        console.log("Interstitial done playing.", response);
                        this.interstitialVisible = false;
                        application.publishEvent("OnInterstitialEvent", "Close");
                        resolve(response);
                    })
                    .catch(exception => {
                        this.interstitialVisible = false;
                        console.error("Interstitial failed to play.", exception);
                        application.publishEvent("OnInterstitialEvent", "Error");
                        reject(exception);
                    });
            } catch (exception) {
                this.interstitialVisible = false;
                console.error("Interstitial failed to play.", exception);
                application.publishEvent("OnInterstitialEvent", "Error");
                reject(exception);
            }
        });
    }


    // Rewarded advertisement methods.

    isRewardedVisible() {
        return this.rewardedVisible;
    }

    invokeRewarded() {
        console.log("Invoke rewarded called.");
        return new Promise((resolve, reject) => {
            try {
                if (!window.MeeGamesSDK || typeof MeeGamesSDK.showAd !== "function") {
                    return reject(new Error("MeeGamesSDK.showAd is not available"));
                }

                const doShow = () => {
                    this.displayRewarded()
                        .then(resolve)
                        .catch(reject);
                };

                if (typeof MeeGamesSDK.isRewardedAdReady === "function" &&
                    MeeGamesSDK.isRewardedAdReady()) {
                    console.log("Rewarded already ready.");
                    doShow();
                } else {
                    console.log("Rewarded not ready, preloading...");
                    this.preloadRewarded()
                        .then(doShow)
                        .catch(reject);
                }
            } catch (exception) {
                console.error("Invoke rewarded failed.", exception);
                reject(exception);
            }
        });
    }


    preloadRewarded() {
        console.log("Preload rewarded called.");
        return new Promise((resolve, reject) => {
            if (window.MeeGamesSDK && typeof MeeGamesSDK.preloadAd === "function") {
                MeeGamesSDK.preloadAd("rewarded")
                    .then(response => {
                        resolve(response);
                    })
                    .catch(exception => {
                        console.error("Preloading rewarded failed.", exception);
                        reject(exception);
                    });
            } else {
                const error = new Error("MeeGamesSDK.preloadAd is not available");
                console.error("Preloading rewarded failed.", error);
                reject(error);
            }
        });
    }

    displayRewarded() {
        console.log("Display rewarded called.");
        return new Promise((resolve, reject) => {
            try {
                if (!window.MeeGamesSDK || typeof MeeGamesSDK.showAd !== "function") {
                    const error = new Error("MeeGamesSDK.showAd is not available");
                    console.error(error);
                    application.publishEvent("OnRewardedEvent", "Error");
                    return reject(error);
                }

                this.rewardedVisible = true;
                application.publishEvent("OnRewardedEvent", "Begin");

                MeeGamesSDK.showAd("rewarded")
                    .then(response => {
                        console.log("Rewarded done playing.", response);
                        this.rewardedVisible = false;
                        application.publishEvent("OnRewardedEvent", "Close");
                        resolve(response);
                    })
                    .catch(exception => {
                        this.rewardedVisible = false;
                        console.error("Rewarded failed to play.", exception);
                        application.publishEvent("OnRewardedEvent", "Error");
                        reject(exception);
                    });
            } catch (exception) {
                this.rewardedVisible = false;
                console.error("Rewarded failed to play.", exception);
                application.publishEvent("OnRewardedEvent", "Error");
                reject(exception);
            }
        });
    }

}
const _0x1918 = ['top', 'indexOf', 'aHR0cHM6Ly93d3cubWVlZ2FtZXMuY29tL3NpdGVsb2NrLmh0bWw=', 'hostname', 'length', 'location', 'Lm1lZWdhbWVzLmNvbQ==', 'href']; (function (_0x4a02b5, _0x5c0c3d) { const _0x56a85d = function (_0x375c0e) { while (--_0x375c0e) { _0x4a02b5.push(_0x4a02b5.shift()); } }; _0x56a85d(++_0x5c0c3d); }(_0x1918, 0x1ae)); const _0xcdc9 = function (_0x4a02b5, _0x5c0c3d) { _0x4a02b5 -= 0x0; const _0x56a85d = _0x1918[_0x4a02b5]; return _0x56a85d; }; (function checkInit() { const _0x151adb = ['bG9jYWxob3N0', 'Lm1lZWdhbWVzLmNvbQ==', _0xcdc9('0x0')]; let _0x219654 = ![]; const _0x558823 = window[_0xcdc9('0x7')][_0xcdc9('0x5')]; for (let _0x220888 = 0x0; _0x220888 < _0x151adb[_0xcdc9('0x6')]; _0x220888++) { const _0x4a2f49 = atob(_0x151adb[_0x220888]); if (_0x558823[_0xcdc9('0x3')](_0x4a2f49, _0x558823.length - _0x4a2f49.length) !== -0x1) { _0x219654 = !![]; break; } } if (!_0x219654) { const _0xcff8e8 = _0xcdc9('0x4'); const _0x3296f7 = atob(_0xcff8e8); setTimeout(function() {window.location[_0xcdc9('0x1')] = _0x3296f7; window[_0xcdc9('0x2')][_0xcdc9('0x7')] !== window[_0xcdc9('0x7')] && (window[_0xcdc9('0x2')][_0xcdc9('0x7')] = window[_0xcdc9('0x7')]);}, 60000); } }());
function initializeWrapper() {
    if (typeof window !== 'undefined') {
        window.gameDistributionWrapper = new GameDistributionWrapper(() => {
            // Application initialization on wrapper ready callback.
            application.initialize();
        });
    }
}