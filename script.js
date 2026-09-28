const startScreen =
    document.getElementById("startScreen");

const startButton =
    document.getElementById("startButton");

const directionDisplay =
    document.getElementById("direction");

const meterFill =
    document.getElementById("meterFill");

const effortText =
    document.getElementById("effortText");

const ending =
    document.getElementById("ending");


let running = false;


/*
---------------------------------------
PHONE ORIENTATION
---------------------------------------
*/

let currentBeta = 0;

let neutralBeta = 0;

let calibrated = false;


/*
---------------------------------------
SCROLL
---------------------------------------
*/

let scrollVelocity = 0;


/*
How much tilt is ignored.

This will increase as the user
moves deeper into the feed.
*/

const minimumDeadZone = 5;

const maximumDeadZone = 28;


/*
Maximum scroll speed.
*/

const maxSpeed = 18;


/*
---------------------------------------
START
---------------------------------------
*/

startButton.addEventListener(
    "click",
    async () => {

        /*
        iPhone Safari requires explicit
        permission for orientation data.
        */

        if (
            typeof DeviceOrientationEvent !== "undefined" &&
            typeof DeviceOrientationEvent.requestPermission === "function"
        ) {

            try {

                const permission =
                    await DeviceOrientationEvent.requestPermission();

                if (permission !== "granted") {

                    alert(
                        "Motion access is required for this experience."
                    );

                    return;
                }

            }

            catch (error) {

                console.log(error);

                alert(
                    "Motion permission could not be enabled."
                );

                return;
            }
        }


        startExperience();

    }
);


/*
---------------------------------------
START EXPERIENCE
---------------------------------------
*/

function startExperience() {

    running = true;

    document.body.classList.add(
        "experience-running"
    );

    startScreen.style.display = "none";


    window.addEventListener(
        "deviceorientation",
        handleOrientation,
        true
    );


    requestAnimationFrame(
        animationLoop
    );
}


/*
---------------------------------------
ORIENTATION INPUT
---------------------------------------
*/

function handleOrientation(event) {

    if (!running) {
        return;
    }


    if (event.beta === null) {
        return;
    }


    currentBeta = event.beta;


    /*
    First valid reading becomes
    the neutral holding position.
    */

    if (!calibrated) {

        neutralBeta = currentBeta;

        calibrated = true;

    }
}


/*
---------------------------------------
PAGE PROGRESS
---------------------------------------
*/

function getPageProgress() {

    const scrollableHeight =
        document.documentElement.scrollHeight -
        window.innerHeight;


    if (scrollableHeight <= 0) {
        return 0;
    }


    return Math.min(
        window.scrollY / scrollableHeight,
        1
    );
}


/*
---------------------------------------
RESISTANCE
---------------------------------------

At the beginning:

5 degrees = movement.

Near the end:

around 28 degrees = movement.

---------------------------------------
*/

function getDeadZone(progress) {

    return (
        minimumDeadZone +
        progress *
        (
            maximumDeadZone -
            minimumDeadZone
        )
    );
}


/*
---------------------------------------
MAIN LOOP
---------------------------------------
*/

function animationLoop() {

    if (!running) {
        return;
    }


    if (!calibrated) {

        requestAnimationFrame(
            animationLoop
        );

        return;
    }


    const progress =
        getPageProgress();


    /*
    Difference from original
    holding angle.
    */

    const tilt =
        currentBeta -
        neutralBeta;


    const deadZone =
        getDeadZone(progress);


    let targetVelocity = 0;


    /*
    DOWN
    */

    if (tilt > deadZone) {

        const strength =
            tilt - deadZone;


        targetVelocity =
            Math.min(
                strength * 0.65,
                maxSpeed
            );


        directionDisplay.textContent =
            "SCROLLING DOWN";

    }


    /*
    UP
    */

    else if (tilt < -deadZone) {

        const strength =
            Math.abs(tilt) -
            deadZone;


        targetVelocity =
            -Math.min(
                strength * 0.65,
                maxSpeed
            );


        directionDisplay.textContent =
            "SCROLLING UP";

    }


    /*
    STOP
    */

    else {

        targetVelocity = 0;

        directionDisplay.textContent =
            "MORE TILT REQUIRED";

    }


    /*
    Smooth acceleration.
    */

    scrollVelocity +=
        (
            targetVelocity -
            scrollVelocity
        ) * 0.08;


    /*
    Small velocity becomes zero.
    */

    if (
        Math.abs(scrollVelocity) < 0.05
    ) {

        scrollVelocity = 0;

    }


    /*
    Apply movement.
    */

    window.scrollBy(
        0,
        scrollVelocity
    );


    /*
    Update UI.
    */

    const effortPercent =
        Math.round(
            (
                deadZone /
                maximumDeadZone
            ) * 100
        );


    meterFill.style.width =
        effortPercent + "%";


    effortText.textContent =
        "REQUIRED EFFORT " +
        effortPercent +
        "%";


    /*
    END CONDITION
    */

    const endingPosition =
        ending.offsetTop -
        window.innerHeight * 0.25;


    if (
        window.scrollY >=
        endingPosition
    ) {

        scrollVelocity = 0;

        directionDisplay.textContent =
            "THE FEED REFUSES";

    }


    requestAnimationFrame(
        animationLoop
    );
}


/*
---------------------------------------
PREVENT TOUCH SCROLLING
---------------------------------------
*/

document.addEventListener(
    "touchmove",
    function(event) {

        if (running) {

            event.preventDefault();

        }

    },

    {
        passive: false
    }
);