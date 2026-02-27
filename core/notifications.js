import notifier from 'node-notifier';

// Create a nodejs script that displays a desktop notification on a cross platform system:
function displayDesktopNotification(msg){
    notifier.notify({
        title: 'Desktop Notification',
        message: msg,
        // icon: 'path/to/icon.png',
        sound: true,
        wait: true
    });
}

try {
  displayDesktopNotification("Hello!");
} catch (error) {
  console.error(error);
}

// Alerts?
// https://github.com/ahmadawais/cli-alerts/tree/main => https://github.com/ahmadawais/cli-alerts/blob/main/index.js
// => https://github.com/sindresorhus/log-symbols/blob/main/symbols.js