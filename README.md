# Siren of Shame Client

## Install on a Raspberry Pi

See our blog [Raspberry Pi Powered Siren of Shame via Node.js](http://blog.sirenofshame.com/2014/07/raspberry-pi-powered-siren-of-shame-via.html).  

Summary:

* Download node source code, extract, `./configure`, `make`, `sudo make install`
* Install libusb: `sudo apt-get install libusb-dev`
* `git clone git@github.com:AutomatedArchitecture/node-sos-client.git`
* `cd node-sos-client`
* `npm install`
* Copy config.json.example to config.json and edit.
* `sudo node build/sos-client.js`

To run as a service

```
sudo mv <sos-client> /opt/sos-client
sudo cp /opt/sos-client/init.d-scripts/sos-client /etc/init.d/
sudo update-rc.d sos-client defaults
sudo service sos-client start
```

## Configuration

Modify the config.json file to customize which server(s) to connect to, what to do on build fail, etc.

### Example

```
{
    "builds": [
        {
            "type": "jenkins",
            "config": {
                "url": "http://127.0.0.1/jenkins/api/json/",
                "username": "[username]",
                "password": "[password]"
            },
            "interval": 3000
        },
        {
            "type": "teamcity",
            "config": {
                "url": "http://127.0.0.1/httpAuth/app/rest/builds/buildType:MyBuildIdentifier",
                "buildTypes": [ "BuildTypeId1", "BuildTypeId2" ],
                "username": "<username>",
                "password": "<password>"
            },
            "interval": 3000
        },
        {
            "type": "bamboo",
            "config": {
                "url": "https://bamboo.example.com/rest/api/latest/result/BUILDNAME-BUILDPLAN.json?max-results=1",
                "username": "<username>",
                "password": "<password>"
            },
            "interval": 3000
        }
    ]
    "onSuccess": {
        "audioPatternIndex": null, 
        "audioDuration": null,
        "ledPatternIndex": null,
        "ledPlayDuration": null
    },
    "onFail": {
        "audioPatternIndex": 0, 
        "audioDuration": 1000,
        "ledPatternIndex": 1,
        "ledPlayDuration": null
    },
}
```

### builds

An array of build objects. To monitor multiple builds enter multiple build objects into this section.

### build

* _type_ - Required. Either "teamciy", "bamboo", or "jenkins"
* _interval_ - Optional.  Defaults to 30 seconds.  Values are in milliseconds.
* _config_ - The build's url, and the server's username, and password, see below

### url

The build url represents the location to get JSON data.  For bamboo use a format like:

> https://127.0.0.1/rest/api/latest/result/BUILDNAME-BUILDPLAN.json?max-results=1

For TeamCity use a format like:

> http://127.0.0.1/httpAuth/app/rest/builds/?locator=status:failure,lookupLimit:1

And for Jenkins use a format like:

> http://127.0.0.1/jenkins/api/json/

### buildTypes

An array of the build types to watch.  Currently only supported by Team City.  Leave 
off to watch all builds on the server.

### onFail/onSuccess

The onFail and onSuccess sections are optional.  They consists of the following attributes:

* _audioPatternIndex_ - Which audio pattern to play.  Set this and _audioDuration_ to null to turn off the siren audio (or do nothing).
* _audioDuration_ - How long to play the audio in milliseconds.  Set to null for "forever".
* _ledPatternIndex_ - Which led pattern to play.  Set this and _ledPlayDuration_ to null to turn off the siren leds (or do nothing).
* _ledPlayDuration_ - How long to play the leds in milliseconds.  Set to null for "forever".

## Common Patterns

### Light lights until success

To light the lights on failure and keep them on until the build is passing again do something like this:

```
    "onFail": {                  // when the build fails, play:
        "audioPatternIndex": 0,  // sad trombone
        "audioDuration": 1000,   // for one second; and
        "ledPatternIndex": 0,    // blink led's
        "ledPlayDuration": null  // forever
    },
    "onSuccess": {                 // when the build passes:
        "audioPatternIndex": null, // stop the audio
        "audioDuration": null,     // no really stop the auduio
        "ledPatternIndex": null,   // stop the leds
        "ledPlayDuration": null    // no really stop the leds
    },
```

### Chirp on checkin

To chirp the siren on every check-in do something like this:  

**Note:** This pattern is the default if no onFail or onSuccess is specified

```
    "onFail": {                  // when the build fails, play
        "audioPatternIndex": 0,  // sad trombone
        "audioDuration": 1000,   // for one second; and
        "ledPatternIndex": 0,    // blink the led's
        "ledPlayDuration": 5000  // for five seconds (enough to be annoying)
    },
    "onSuccess": {               // when the build succeeds
        "audioPatternIndex": 1,  // chirp
        "audioDuration": 500,    // for a half second
        "ledPatternIndex": 0,    // blink the led's
        "ledPlayDuration": 500   // for a half second
    },
```


