/**
 * FireSignal Component (Step 3 - Signal Firing Interface)
 *
 * This is the main interface where users fire signals to propagate through the network.
 * It provides different functionality based on the cell's role:
 *
 * For Master Cells (in Ring Mode):
 * - Shows ring diagram visualization
 * - Controls exercise level based on firing frequency
 * - Toggles between healthy/unhealthy mode
 * - Toggles sympathetic activation (affects heart rate)
 *
 * For Regular Cells:
 * - Simple fire button to send signals to neighbours
 *
 * Activity Level Detection (Master Cell Only):
 * The time between button presses determines the exercise level:
 * - ≤3 seconds: Sprinting (fastest heart rate)
 * - ≤5 seconds: Jogging
 * - ≤7 seconds: Walking
 * - >7 seconds: Rest (slowest heart rate)
 *
 * Each activity level has different Conduction Velocity (CV) and Refractory Period (RP) values.
 */

import {  cellID, messageInterface, neighbours, cellInfo, neighbourInterface, activityInterface, circlingCells } from "../data/GlobalVariables";
import { getRandomInt, notificationHandler, sendSettingsChangedNotification, removeItemFromArray, getActivityByName } from "../Services/SharedFunctions";
import { ActionType } from "../data/Enums";
import RunningInfoSubPage from './RunningInfo';
import RingDiagram from './RingDiagram';
import { useRef } from "react";
import { Box, Checkbox, FormControlLabel} from "@mui/material";
import Grid from '@mui/material/Grid2'
import { useRunningInfo } from '../data/CountContext';
import React from "react";
import { useChannel } from "ably/react";
import { CHANNEL_NAME } from "../data/Constants";

/**
 * FireSignalPros - Component props interface
 * @property cellList - Array of all cells in the ring (empty if not in ring mode)
 * @property neighbourList - Array of this cell's direct neighbours
 */
interface FireSignalPros{
    cellList : neighbourInterface[]
    neighbourList: neighbourInterface[]
}

/**
 * FireSignal Component
 * Main interface for firing signals and controlling simulation parameters
 */
const FireSignal = ({cellList, neighbourList} : FireSignalPros) => {
    // Access to running info context for updating CV/RP values
    const { setRunningInfo } = useRunningInfo();

    // Subscribe to Ably channel for real-time communication
    const { channel } = useChannel({ channelName: CHANNEL_NAME }, () => {
    })

    // State: Whether this cell is healthy (true) or unhealthy/blocked (false)
    const [isHealthy, setIsHealthy] = React.useState(true);

    // State: Whether sympathetic activation is disabled (true = no activation, false = activated)
    // Sympathetic activation simulates stress/exercise effects on the heart
    const [isNoSympathetic, setIsNoSympathetic] = React.useState(true);

    // Default activity configuration (rest with no sympathetic activation)
    let selectedActivity: activityInterface | null =  getActivityByName("rest","NoSympatheticActivation");

    // List of other cells in the ring (excluding this cell)
    let blockedCellList = [...cellList]
    removeItemFromArray(cellID, blockedCellList)

    // Timestamp of when the fire button becomes available again
    let endTime = Date.now()

    /**
     * handleNext - Fires a signal from this cell
     *
     * This function:
     * 1. Determines activity level based on time since last fire (master cell only)
     * 2. Retrieves appropriate CV/RP values for the activity
     * 3. Creates and sends a fire notification message
     * 4. Hides the fire button during refractory period
     * 5. Re-enables the fire button after RP completes
     *
     * Activity Level Detection (based on time between fires):
     * - ≤3 seconds: Sprinting (highest heart rate)
     * - ≤5 seconds: Jogging
     * - ≤7 seconds: Walking
     * - >7 seconds: Rest (lowest heart rate)
     */
    const handleNext = () => {
        let activityName = "rest"

        // Calculate time elapsed since last fire
        let waitingTime = Date.now() - endTime

        // Determine activity level based on firing frequency
        if(waitingTime <= 3000 )
        {
            activityName = "sprinting"  // Very fast firing = high exercise
        }
        else if(waitingTime <= 5000 )
        {
            activityName = "jogging"    // Fast firing = moderate exercise
        }
        else if(waitingTime <= 7000 )
        {
            activityName = "walking"    // Moderate firing = light exercise
        }
        else
        {
            activityName = "rest"       // Slow firing = resting heart rate
        }

        // Get activity configuration with appropriate CV/RP values
        let runningActivity = getActivityByName(activityName, isNoSympathetic?"NoSympatheticActivation":"SympatheticActivation")

        if(runningActivity != null)
        {
            // Capitalize activity name for display
            activityName = activityName.charAt(0).toUpperCase() + activityName.slice(1);
            let modeDisplayName = isNoSympathetic?"No Sympathetic Activation":"Sympathetic Activation"

            // Update running info context with new CV/RP values
            setRunningInfo({cvValue: runningActivity.cv_healthy_value, rpValue: runningActivity.rp_healthy_value, modeName:modeDisplayName , levelName:activityName, inReentry:false})

            // Create fire notification message
            let newMessage : messageInterface = {
                uuid: getRandomInt(1000000000),
                fromCellId: cellID,
                toCellIds: neighbours,
                action: ActionType.FireNotification,
                fireTime: Date.now(),
                initialCellId: cellID,
                circlingCellIds: circlingCells,
                selectedActivity: null,
                blockedCellId: "",
                isHealthyRun: isHealthy,
                inReentryMode: false,
                healthy_cv: runningActivity.cv_healthy_value,
                unhealthy_cv: runningActivity.cv_unhealthy_value,
                healthy_rp: runningActivity.rp_healthy_value,
                unhealthy_rp: runningActivity.rp_unhealthy_value,
                modeName: modeDisplayName,
                levelName: activityName
            }
            console.log("isHealthy: " + isHealthy)
            console.log("modeDisplayName: " + modeDisplayName)

            // Send the fire notification to neighbours
            notificationHandler(newMessage, true, channel)

            // Hide fire button during refractory period
            if(fireButtonRef.current != null)
                fireButtonRef.current.style.visibility = "hidden"

            // Re-enable fire button after refractory period
            // Use unhealthy RP if this cell is blocked, otherwise use healthy RP
            setTimeout(()=> {
                if(fireButtonRef.current != null){
                    fireButtonRef.current.style.visibility = "visible"
                    endTime = Date.now()  // Record when button becomes available
                }
            },isHealthy ? runningActivity.rp_healthy_value : (cellInfo.isBlocked ? runningActivity.rp_unhealthy_value : runningActivity.rp_healthy_value) );
        }
    }
    /**
     * handleModeChange - Toggles sympathetic activation mode
     *
     * Sympathetic activation simulates the effect of stress or exercise on the heart.
     * When enabled, it affects the CV and RP values used in the simulation.
     *
     * @param event - Checkbox change event
     */
    const handleModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setIsNoSympathetic(
            event.target.checked,
        );
    };

    /**
     * handleHealthyChange - Toggles between healthy and unhealthy mode
     *
     * When unchecked (unhealthy mode):
     * - Designates the first neighbour as the "blocked" cell
     * - Blocked cells have slower conduction velocity and longer refractory period
     * - This simulates damaged heart tissue that can cause arrhythmias
     *
     * Sends a settings changed notification to update all cells in the ring.
     *
     * @param event - Checkbox change event
     */
    const handleHealthyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setIsHealthy(
            event.target.checked,
        );

        if(selectedActivity != null)
        {
            if(event.target.checked)
            {
                // Healthy mode: no blocked cell
                sendSettingsChangedNotification(selectedActivity, event.target.checked, null, channel)
            }
            else
            {
                // Unhealthy mode: designate first neighbour as blocked cell
                let blockedCell:neighbourInterface = neighbourList[0]
                sendSettingsChangedNotification(selectedActivity, isHealthy, blockedCell, channel)
            }
        }
    };

    // Reference to the fire button element (used to hide/show during RP)
    const fireButtonRef = useRef<HTMLAnchorElement | null>(null);

    /**
     * getRenderContents - Renders different UI based on cell role
     *
     * Master Cell (in ring mode):
     * - Shows ring diagram visualization
     * - Shows checkboxes for sympathetic activation and healthy/unhealthy mode
     * - Shows fire button
     *
     * Regular Cell:
     * - Shows only fire button
     *
     * @returns JSX element with appropriate content
     */
    function getRenderContents()
    {
        if(cellInfo.inRing && cellInfo.isMaster)
        {
            return(
                <Box>
                    {/* Ring Diagram - Visual representation of the ring topology */}
                    <RingDiagram
                        cellList={cellList}
                        blockedCellId={blockedCellList.length > 0 && !isHealthy ? blockedCellList[0].uid : ""}
                    />

                    <div className="pt-2"></div>

                    {/* Control checkboxes for master cell */}
                    <Grid container spacing={2}>
                        {/* Toggle sympathetic activation (affects heart rate) */}
                        <FormControlLabel
                            control={<Checkbox checked={isNoSympathetic}  onChange={handleModeChange} />}
                            label="No Sympathetic Activation" />

                        {/* Toggle healthy/unhealthy mode (affects blocked cell) */}
                        <FormControlLabel
                            control={<Checkbox checked={isHealthy}  onChange={handleHealthyChange} />}
                            label="Healthy" />
                    </Grid>

                    <div className="pt-2"></div>

                    {/* Fire button for master cell */}
                    <div className="col s2 offset-s5">
                        <a ref={fireButtonRef} onClick={handleNext} className="btn-floating btn-large pulse red lighten-2" id='fire_button_master'>
                            <i className="material-icons left">sunny</i>fire
                        </a>
                    </div>
                </Box>

            );
        }
        else
        {
            // Regular cell: just show fire button
            return(
                <div className="col s2 offset-s5">
                    <a ref={fireButtonRef} onClick={handleNext} className="btn-floating btn-large pulse red lighten-2" id='fire_button_regular'>
                        <i className="material-icons left">sunny</i>fire
                    </a>
                </div>
            );
        }
    }

    return (
        <div>
            {/* Display current cell info and neighbours */}
            <RunningInfoSubPage cellList={cellList} neighbourList={neighbourList}  />
            <div className="pt-2"></div>

            {/* Render fire button and controls based on cell role */}
            {getRenderContents()}

        </div>
    );
}

export default FireSignal