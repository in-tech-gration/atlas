import util from "node:util";
import { exec } from 'node:child_process';
import xml2js from "xml2js";
import chalk from 'chalk';
import prompts from "prompts";
const execAsync = util.promisify(exec);

export default async function mountUnmount({ options, instance }) {

    const { mount } = options;

    if (instance.platform !== "darwin") {

        return console.log("Currently --mount is only supported on macOS.");

    }

    if (!["on", "off", "set"].includes(mount)) {

        return console.log("Please provide a valid option: on|off|set");

    }

    if (mount === "set") {

        const showExternalDrivesCommand = "diskutil list -plist external"; // MacOS

        try {

            const { stdout, stderr } = await execAsync(showExternalDrivesCommand);

            if (stdout) {

                const currentSelectedDrives = instance.config.get('mount_drives');
                const xml = stdout;
                const json = await xml2js.parseStringPromise(xml);
                const driveNames = json.plist.dict[0].array[2].string;
                const { selectedDriveNames } = await prompts(
                    {
                        type: 'multiselect',
                        name: 'selectedDriveNames',
                        message: 'Pick drive(s) to mount/unmount',
                        choices: driveNames.map(drive => {
                            const option = {
                                title: drive,
                                value: drive
                            }
                            if (currentSelectedDrives?.includes(drive)) {
                                option.selected = true;
                            }
                            return option
                        }),
                        // max: 2,
                        hint: '- Space to select. Return to submit'
                    }
                )
                if (selectedDriveNames) {
                    instance.config.set('mount_drives', selectedDriveNames);
                }

            }
            if (stderr) {
                console.log({ stderr })
            }

        } catch (error) {

            console.log("Error:", error.message);

        }
        return;

    }

    const mountDrives = instance.config.get("mount_drives");

    if (!mountDrives) {
        return console.log("Could not find selected drives for mounting/unmounting. Please run the --mount set command to set the drives to be mounted/unmounted.");
    }

    if (mount === "on") {

        for (const drive of mountDrives) {

            const escapedDrive = drive.replaceAll(" ", "\\ ");
            console.log(`Mounting: ${chalk.cyan(escapedDrive)}`);

            try {
                const { stdout, stderr } = await execAsync(`diskutil mountDisk ${escapedDrive}`);
                if (stderr) {
                    console.log(stderr);
                }
                if (stdout) {
                    console.log(chalk.green(stdout));
                }
            } catch (error) {
                console.log(`Error mounting ${drive}`);
            }
        }
        return;

    }

    if (mount === "off") {

        for (const drive of mountDrives) {

            const escapedDrive = drive.replaceAll(" ", "\\ ");
            console.log(`Unmounting: ${chalk.cyan(escapedDrive)}`);

            try {
                const { stdout, stderr } = await execAsync(`diskutil unmountDisk ${escapedDrive}`);
                if (stderr) {
                    console.log(stderr);
                }
                if (stdout) {
                    console.log(chalk.green(stdout));
                }
            } catch (error) {
                console.log(`Error unmounting ${drive}`);
            }
        }
        return;
    }
}