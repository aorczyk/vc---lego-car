let y = 0
let x = 0
let lastX = 0
let lastY = 0
let state = 0
let lastState = 0
let rightInputType = 0
let debug = 0;
let button1 = 0
let button2 = 0
let button3 = -1
let button4 = 1
let timeOut = 0
let latestCommands: { [key: string]: number } = {}

basic.clearScreen()
pfTransmitter.connectIrSenderLed(AnalogPin.P0)

bluetooth.startUartService()

bluetooth.onBluetoothConnected(function () {
})

bluetooth.onUartDataReceived(serial.delimiters(Delimiters.NewLine), function () {
    let command = bluetooth.uartReadUntil(serial.delimiters(Delimiters.NewLine))
    let commadParts = command.split("=")

    latestCommands[commadParts[0]] = parseFloat(commadParts[1])
})

input.onButtonPressed(Button.A, function() {
    debug = debug ? 0 : 1

    if (debug) {
        led.plot(2, 2)
    } else {
        basic.clearScreen()
    }
})

basic.forever(function () {
    while (Object.keys(latestCommands).length) {
        let commandName = Object.keys(latestCommands)[0]
        let commandValue = latestCommands[commandName]
        delete latestCommands[commandName];
        
        if (commandName == "-v") {
            bluetooth.uartWriteLine("vc;ox;1;-30;30;-7;7;7;0;0")
            bluetooth.uartWriteLine("vc;oy;1;-30;30;-7;7;1;0;0")
            bluetooth.uartWriteLine("vc;sl;1;-7;7;1;0;0")
            bluetooth.uartWriteLine("vc;sr;1;-7;7;7;0;0")
            bluetooth.uartWriteLine("vc;jrx;-7;7;7;0;0")
            bluetooth.uartWriteLine("vc;jry;-7;7;1;0;0")
            bluetooth.uartWriteLine("vc;m;LEGO Car;")
            bluetooth.uartWriteLine("vc;b;1;2")
            bluetooth.uartWriteLine("vc;b;2;2")
            bluetooth.uartWriteLine("vc;so;90")
        } else if (commandName == "oy" || commandName == "sl" || commandName == "jry") {
            y = commandValue
            pfTransmitter.setSpeed(1, 1, commandValue)
        } else if (commandName == "ox" || commandName == "sr" || commandName == "jrx") {
            x = commandValue
            pfTransmitter.setSpeed(1, 2, commandValue)
        } else if (commandName == "1") {
            button1 = button1 ? 0 : 1

            if (button1 == 0){
                pfTransmitter.setSpeed(2, 1, 0)
                pfTransmitter.setSpeed(2, 2, 0)
                bluetooth.uartWriteLine("vc;b;1;2")
                bluetooth.uartWriteLine("vc;b;2;2")
                button2 = 0;
            } else if (button1 == 1) {
                pfTransmitter.setSpeed(2, 1, 1)
                pfTransmitter.setSpeed(2, 2, 1)
                bluetooth.uartWriteLine("vc;b;1;1")
                bluetooth.uartWriteLine("vc;b;2;2")
            }
        } else if (commandName == "2") {
            button2 = button2 ? 0 : 1

            if (button2 == 0) {
                if (button1 == 1) {
                    pfTransmitter.setSpeed(2, 1, 1)
                } else {
                    pfTransmitter.setSpeed(2, 1, 0)
                }
                bluetooth.uartWriteLine("vc;b;2;2")
            } else if (button2 == 1) {
                pfTransmitter.setSpeed(2, 1, 7)
                bluetooth.uartWriteLine("vc;b;2;3")
            }
        } else if (commandName == "3") {
            button3 *= -1
        } else if (commandName == "4") {
            button4 *= -1
        } else if (commandName == "up" || commandName == "w") {
            y = -7 * button3
            pfTransmitter.setSpeed(1, 1, y)
        } else if (commandName == "down" || commandName == "s") {
            y = 7 * button3
            pfTransmitter.setSpeed(1, 1, y)
        } else if (commandName == "!up" || commandName == "!down") {
            y = 0
            pfTransmitter.setSpeed(1, 1, y)
        } else if (commandName == "a" || commandName == "left") {
            x = -7 * button4
            pfTransmitter.setSpeed(1, 2, x)
        } else if (commandName == "d" || commandName == "right") {
            x = 7 * button4
            pfTransmitter.setSpeed(1, 2, x)
        } else if (commandName == "!d" || commandName == "!right" || commandName == "!a" || commandName == "!left") {
            x = 0
            pfTransmitter.setSpeed(1, 2, x)
        }

        // Red light when break.

        if (button1 == 1 && lastY != y) {
            if ((lastY > 0 && y < lastY) || (lastY < 0 && y > lastY)) {
                pfTransmitter.setSpeed(2, 2, 7)

                if (debug) {
                    basic.showIcon(IconNames.SmallSquare)
                }

                timeOut += 1;
                let t = timeOut

                control.inBackground(function () {
                    let n = 0
                    while (t == timeOut && n < 50) {
                        basic.pause(20)
                        n += 1
                    }

                    if (t == timeOut) {
                        pfTransmitter.setSpeed(2, 2, 1)

                        if (debug) {
                            basic.clearScreen()
                        }
                    }
                })
            } else {
                timeOut = 0
                pfTransmitter.setSpeed(2, 2, 1)
            }
        }

        if (lastX != x || lastY != y) {
            if (debug) {
                led.unplot(Math.floor(2 * lastX / 7) + 2, Math.floor(2 * lastY / 7) + 2)
            }

            lastX = x
            lastY = y

            if (debug) {
                led.plot(Math.floor(2 * lastX / 7) + 2, Math.floor(2 * lastY / 7) + 2)
            }
        }
    }
})