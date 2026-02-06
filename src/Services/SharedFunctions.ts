/**
 * SharedFunctions - Core Utility Functions
 *
 * This file contains all the shared utility functions used throughout the application.
 * These functions handle:
 * - Activity configuration retrieval (CV/RP values for different exercise levels)
 * - Signal propagation and notification handling
 * - Neighbour relationship management
 * - Ring topology construction and management
 * - Member presence tracking
 * - HTTP communication with backend server
 * - Visual feedback (body flashing)
 */

import { PresenceMessage, RealtimeChannel } from "ably";
import { available_members, neighbours, cellID, notificationTrackingItems, neighbourInterface, messageInterface, circlingCells, refractoryPeriodStatus, activityInterface, cellInfo, messagePostInterface } from "../data/GlobalVariables";
import { ACTION_NOTIFICATION, CELL_API_URL, CHANNEL_SETUP } from "../data/Constants";

import { ActionType } from "../data/Enums";

import activityData from '../data/myocyteProperties.json';

/**
 * getActivityByName - Retrieves activity configuration for a given exercise level
 *
 * This function looks up the appropriate Conduction Velocity (CV) and Refractory Period (RP)
 * values based on:
 * - Number of cells in the ring
 * - Activity level (rest, walking, jogging, sprinting)
 * - Sympathetic activation mode
 *
 * The configuration is loaded from myocyteProperties.json which contains scientifically
 * accurate values for cardiac myocyte behavior at different exercise levels.
 *
 * @param name - Activity name ("rest", "walking", "jogging", "sprinting")
 * @param modeName - Mode name ("NoSympatheticActivation" or "SympatheticActivation")
 * @returns Activity configuration with CV/RP values, or null if not found
 */
export function getActivityByName(name:string, modeName:string): activityInterface| null {
    // Get the number of cells in the ring
    const numCellsInRing = circlingCells.length;

    // Find the configuration for this number of cells
    let cellConfig = activityData.number_of_cells.find(c => c.number === numCellsInRing);

    // If no exact match, find the closest smaller number
    if (cellConfig === undefined) {
        // Filter configurations with number <= numCellsInRing and sort descending
        const smallerConfigs = activityData.number_of_cells
            .filter(c => c.number <= numCellsInRing)
            .sort((a, b) => b.number - a.number);

        if (smallerConfigs.length > 0) {
            cellConfig = smallerConfigs[0]; // Closest smaller number
            console.log(`⚠️ No exact configuration for ${numCellsInRing} cells, using closest smaller: ${cellConfig.number} cells`);
        } else {
            // If no smaller config exists, use the smallest available
            cellConfig = activityData.number_of_cells
                .sort((a, b) => a.number - b.number)[0];
            console.log(`⚠️ No configuration <= ${numCellsInRing} cells, using smallest available: ${cellConfig.number} cells`);
        }
    }

    console.log(`🔍 Using configuration for ${cellConfig.number} cells (actual: ${numCellsInRing})`);

    // Find the mode (NoSympatheticActivation or SympatheticActivation)
    const foundMode = cellConfig.modes.find(m => m.name === modeName);

    if(foundMode != undefined)
    {
        // Find the specific activity within the mode
        const foundActivity = foundMode.activities.find(a => a.activity_name === name)
        if(foundActivity != undefined)
        {
            // Calculate actual CV/RP values by multiplying base values with activity rates
            const healthyCV = activityData.cv * foundActivity.healthy_cv_rate;
            const healthyRP = activityData.rp * foundActivity.healthy_rp_rate;
            const unhealthyCV = activityData.cv * foundActivity.unhealthy_cv_rate;
            const unhealthyRP = activityData.rp * foundActivity.unhealthy_rp_rate;

            console.log("🔍 Activity Configuration:");
            console.log("  Mode:", modeName);
            console.log("  Activity:", name);
            console.log("  Healthy CV:", Math.round(healthyCV), "ms");
            console.log("  Healthy RP:", Math.round(healthyRP), "ms");
            console.log("  Unhealthy CV:", Math.round(unhealthyCV), "ms");
            console.log("  Unhealthy RP:", Math.round(unhealthyRP), "ms");

            return {
                displayName: foundActivity.activity_name,
                rp_healthy_value: healthyRP,
                rp_unhealthy_value: unhealthyRP,
                cv_healthy_value: healthyCV,
                cv_unhealthy_value: unhealthyCV
            }
        }
    }

    return null
}

/**
 * sendSettingsChangedNotification - Notifies all cells in ring of settings change
 *
 * This is called when the master cell toggles between healthy/unhealthy mode.
 * It broadcasts the change to all cells in the ring so they can update their
 * blocked cell status.
 *
 * @param selectedActivity - Current activity configuration
 * @param isHealthyRun - Whether running in healthy mode
 * @param blockedCell - The cell designated as blocked/unhealthy (null if healthy mode)
 * @param channel - Ably channel for publishing
 */
export function sendSettingsChangedNotification(selectedActivity:activityInterface, isHealthyRun: boolean, blockedCell: neighbourInterface | null, channel:RealtimeChannel)
{
    let newMessage : messageInterface = {
        uuid: getRandomInt(1000000000),
        fromCellId: cellID,
        toCellIds: circlingCells,
        initialCellId: cellID,
        circlingCellIds: circlingCells,
        action: ActionType.SettingsChanged,
        fireTime: Date.now(),
        selectedActivity: selectedActivity,
        blockedCellId: blockedCell != null ? blockedCell.uid : "",
        isHealthyRun: isHealthyRun,
        inReentryMode: false,
        healthy_cv: 0,
        unhealthy_cv: 0,
        healthy_rp: 0,
        unhealthy_rp: 0,
        modeName: "",
        levelName: ""
    }

    channel.publish(ACTION_NOTIFICATION, JSON.stringify(newMessage));
}

/**
 * refreshMembers - Updates the available_members list based on presence
 *
 * This function is called when cells join or leave the simulation.
 * It synchronizes the local available_members array with the current
 * presence set from Ably.
 *
 * @param uid - Cell ID that joined or left
 * @param action - AddMember or DeleteMember
 * @param channel - Ably channel for presence queries
 */
export async function refreshMembers(uid:string, action:ActionType, channel:RealtimeChannel){
    var presenceSet = await channel.presence.get();

    if (action === ActionType.DeleteMember)
    {
        // Remove the specific member
        removeMember(uid)
    }
    else
    {
        // Refresh entire member list from presence
        clearNeighbourArray(available_members)
        presenceSet.forEach(addMember);
    }
}

/**
 * addMember - Adds a cell to the available_members list
 *
 * @param item - Presence message containing cell ID
 */
function addMember(item:PresenceMessage) {
    let memberExist = available_members.find(m=>m.uid === item.clientId);
    // Only add if not already in list and not this cell
    if (memberExist === undefined && item.clientId != cellID)
    {
        available_members.push({uid:item.clientId, all:false})
    }
}

/**
 * removeMember - Removes a cell from the available_members list
 *
 * @param cellId - ID of the cell to remove
 */
function removeMember(cellId:string) {
    let memberExist = available_members.find(m=>m.uid === cellId);
    if (memberExist != undefined)
    {
        removeItemFromArray(cellId, available_members).then(() => {
        })
    }
}

/**
 * clearNeighbourArray - Clears all elements from a neighbour array
 *
 * Uses pop() to remove all elements while maintaining the array reference.
 *
 * @param inputArray - Array to clear
 */
export function clearNeighbourArray(inputArray:neighbourInterface[])
{
    let len = inputArray.length;
    for(let i=0; i< len; i++)
    {
        inputArray.pop();
    }
}

/**
 * updateCellsInRing - Updates the ring topology when cells are added/removed
 *
 * This function manages the circular ring structure used in NeighbourRing mode.
 * It handles:
 * - Ensuring this cell is included in the ring
 * - Removing cells that are no longer selected
 * - Adding newly selected cells
 * - Rebuilding neighbour connections to maintain ring topology
 *
 * The ring topology is critical for simulating reentrant arrhythmias, where
 * signals can circulate continuously around the ring.
 *
 * @param selectedCells - Cells selected to be in the ring
 * @param chanel - Ably channel for publishing updates
 */
export function updateCellsInRing(selectedCells : neighbourInterface[], chanel:RealtimeChannel)
{
    // Ensure this cell is in the ring
    if(selectedCells.find(n=>n.uid == cellID) === undefined)
    {
        selectedCells.unshift(
            {
                uid : cellID,
                all:false
            }
        )
    }

    let hasChanges = false;

    // Step 1: Remove cells that are no longer selected
    let deletingCellsFromRing : neighbourInterface[] = []
    for(let i=0; i<circlingCells.length; i++){
        let item = circlingCells[i]
        if(selectedCells.find(n=>n.uid == item.uid) === undefined)
        {
            hasChanges = true;

            // Find left and right neighbours in the ring
            let leftNeighbour : neighbourInterface | null  = null
            let rightNeighbour : neighbourInterface | null  = null

            // Handle wrap-around for last cell
            if (i === circlingCells.length - 1)
            {
                rightNeighbour = circlingCells[0]
            }
            else
            {
                rightNeighbour = circlingCells[i + 1]
            }

            leftNeighbour = circlingCells[i - 1]

            // Notify cells to remove neighbour connections (bidirectional)
            chanel.publish(CHANNEL_SETUP,"removeneighbour,"+item.uid+","+leftNeighbour.uid);
            chanel.publish(CHANNEL_SETUP,"removeneighbour,"+leftNeighbour.uid+","+item.uid);

            chanel.publish(CHANNEL_SETUP,"removeneighbour,"+item.uid+","+rightNeighbour.uid);
            chanel.publish(CHANNEL_SETUP,"removeneighbour,"+rightNeighbour.uid+","+item.uid);

            removeItemFromArray(item.uid, circlingCells)
            deletingCellsFromRing.push({uid:item.uid, all:false})
        }
    }

    // Finalize removal of cells from ring
    if(deletingCellsFromRing.length > 0)
        removeCellsFromRing(deletingCellsFromRing, circlingCells, chanel)


    // Step 2: Add newly selected cells to the ring
    if(selectedCells.length > 0){
        for(let i=0; i<selectedCells.length; i++){
            let item = selectedCells[i]
            if(circlingCells.find(n=>n.uid == item.uid) === undefined)
            {
                hasChanges = true;
                circlingCells.push(
                    {
                        uid: item.uid,
                        all : false
                    }
                )
            }
        }

        // Step 3: Rebuild ring connections if there were changes
        if(hasChanges)
        {
            buildCellRing(selectedCells, chanel);
        }
    }

}

/**
 * updateNeighbours - Updates neighbour connections for Neighbour mode
 *
 * This function synchronizes the local neighbours array with the UI selection.
 * It adds new neighbours and removes deselected ones, publishing notifications
 * to affected cells.
 *
 * @param selectedNeighbours - Neighbours selected in the UI
 * @param doSetup - Whether to publish setup messages
 * @param channel - Ably channel for publishing
 */
export function updateNeighbours(selectedNeighbours : neighbourInterface[], doSetup: boolean, channel:RealtimeChannel )
{
    // Step 1: Find newly selected neighbours
    let newNeighbours : neighbourInterface[] = []
    for(let i=0; i<selectedNeighbours.length; i++){
        let item = selectedNeighbours[i];

        if(!neighbours.find(n=>n.uid == item.uid))
        {
            // Not in current neighbours list, add it
            newNeighbours.push({uid:item.uid, all:false})
        }
    }

    // Add new neighbours
    let canContinue: boolean = false;
    if(newNeighbours.length > 0){
        addNeighbours(newNeighbours, doSetup, channel).then(() => {
            canContinue = true;
        });
    }
    else{
        canContinue = true;
    }

    // Step 2: Find neighbours that were deselected
    if (canContinue)
    {
        let deletingNeighbours : neighbourInterface[] = []

        for(let i=0; i<neighbours.length; i++){
            let item = neighbours[i]
            if(selectedNeighbours.find(n=>n.uid == item.uid) === undefined)
            {
                // In current neighbours but not in selection, remove it
                deletingNeighbours.push({uid:item.uid, all:false})
            }
        }

        // Remove deselected neighbours
        if (deletingNeighbours.length > 0)
            removeNeighbours(deletingNeighbours, doSetup, channel)
    };
}

/**
 * removeNeighbours - Removes neighbour connections
 *
 * Removes cells from the neighbours array and optionally publishes
 * DeleteNeighbour notifications to inform them of the disconnection.
 *
 * @param deletingNeighbours - Neighbours to remove
 * @param doSetup - Whether to publish notifications
 * @param channel - Ably channel for publishing
 */
function removeNeighbours(deletingNeighbours:neighbourInterface[], doSetup: boolean, channel:RealtimeChannel){
    // Remove from local neighbours array
    for(let i=0; i<deletingNeighbours.length; i++){
        let item = deletingNeighbours[i];
        removeItemFromArray(item.uid, neighbours).then(() => {});
    };

    // Notify removed neighbours
    if(doSetup)
    {
        let newMessage : messageInterface = {
            uuid: getRandomInt(1000000000),
            fromCellId: cellID,
            toCellIds: deletingNeighbours,
            initialCellId: cellID,
            circlingCellIds: [],
            action: ActionType.DeleteNeighbour,
            selectedActivity: null,
            blockedCellId: "",
            fireTime: Date.now(),
            isHealthyRun: false,
            inReentryMode: false,
            healthy_cv: 0,
            unhealthy_cv: 0,
            healthy_rp: 0,
            unhealthy_rp: 0,
            modeName: "",
            levelName: ""
        }

        channel.publish(ACTION_NOTIFICATION, JSON.stringify(newMessage));
    }
}

/**
 * notificationHandler - Handles incoming signal propagation messages
 *
 * This is the CORE function for signal propagation simulation. It implements:
 *
 * 1. **Duplicate Detection**: Prevents processing the same signal twice (except in reentry)
 * 2. **Conduction Velocity (CV)**: Delays signal arrival based on CV value
 * 3. **Refractory Period (RP)**: Prevents cell from firing again during RP
 * 4. **Signal Forwarding**: Propagates signal to neighbours (except sender)
 * 5. **Reentry Detection**: Detects when signal returns to blocked cell after RP
 * 6. **Visual Feedback**: Flashes body red when excited, gray during refractory
 *
 * The timing sequence is:
 * - Wait CV milliseconds (signal travel time)
 * - Flash red (excited state)
 * - Forward signal to neighbours
 * - Wait RP milliseconds (refractory period)
 * - Return to resting state (ready to fire again)
 *
 * @param message - Incoming signal message
 * @param isInitialFire - Whether this is the initial signal from master cell
 * @param channel - Ably channel for publishing
 */
export function notificationHandler(message : messageInterface, isInitialFire: boolean, channel:RealtimeChannel)
{
    // Check if we've already processed this signal UUID
    let findUuidResult = notificationTrackingItems.find(n=>n.uuid === message.uuid)

    // Process if: (1) haven't seen this UUID, OR (2) in reentry mode (allow re-processing)
    if(findUuidResult === undefined ||  message.inReentryMode)
    {
        // Only process if: (1) not from self, OR (2) initial fire
        if(message.fromCellId != cellID || isInitialFire)
        {
            // Only process if: (1) this cell is in recipient list, OR (2) initial fire
            if(message.toCellIds.find(m=>m.uid === cellID) != undefined || isInitialFire)
            {
                // Only process if: (1) not in refractory period, OR (2) in reentry mode
                if(!refractoryPeriodStatus.inRefractoryPeriod ||  message.inReentryMode)
                {
                    // Determine refractory period duration based on health status
                    let sleepTime = 0
                    if(message.isHealthyRun)
                    {
                        sleepTime = message.healthy_rp
                    }
                    else
                    {
                        if(cellInfo.isBlocked)
                        {
                            sleepTime = message.unhealthy_rp
                        }
                        else
                        {
                            sleepTime = message.healthy_rp
                        }
                    }

                    // Wait for Conduction Velocity delay, then fire
                    setTimeout(()=> {
                        // Build list of neighbours to forward signal to
                        let newToCellIds: neighbourInterface[] = [];
                        for(let i=0; i<neighbours.length; i++){
                            let item = neighbours[i]
                            // Don't send back to sender
                            if(item.uid != message.fromCellId)
                            {
                                // Don't duplicate if already sent from parent (unless initial fire)
                                if(message.toCellIds.find(n=>n.uid === item.uid) === undefined || isInitialFire)
                                {
                                    newToCellIds.push({uid : item.uid, all:false})
                                }
                            }
                        };

                        // Mark this UUID as processed
                        notificationTrackingItems.push({uuid: message.uuid});

                        // Publish event for visualization
                        channel.publish("events", "fire,"+cellID+","+Date.now()+","+sleepTime);

                        // Flash body red (excited state)
                        flashBody();

                        // Check for reentry: if blocked cell receives its own original signal after RP
                        let gotoReentryMode = false;
                        if(cellInfo.isBlocked)
                        {
                            if(cellInfo.blockedUuid === message.uuid)
                            {
                                gotoReentryMode = true;
                            }
                        }

                        // Log signal to server (unless already in reentry)
                        if(!message.inReentryMode)
                        {
                            httpPostNotification(message, false, gotoReentryMode)
                        }

                        // Forward signal to neighbours
                        if(newToCellIds.length > 0)
                        {
                            let newMessage : messageInterface = {
                                uuid: message.uuid,
                                fromCellId: cellID,
                                initialCellId: message.initialCellId,
                                toCellIds: newToCellIds,
                                circlingCellIds: [],
                                action: ActionType.FireNotification,
                                fireTime: Date.now(),
                                selectedActivity: null,
                                blockedCellId: "",
                                isHealthyRun: message.isHealthyRun,
                                inReentryMode: gotoReentryMode || message.inReentryMode,
                                healthy_cv: message.healthy_cv,
                                unhealthy_cv: message.unhealthy_cv,
                                healthy_rp: message.healthy_rp,
                                unhealthy_rp: message.unhealthy_rp,
                                modeName: message.modeName,
                                levelName: message.levelName
                            }

                            channel.publish(ACTION_NOTIFICATION, JSON.stringify(newMessage))
                        }

                        // Enter refractory period
                        cellInfo.inRefractoryPeriod = true

                        // Wait for Refractory Period, then return to resting state
                        setTimeout(()=> {
                            greyOverlay("") // Clear visual overlay
                            refractoryPeriodStatus.inRefractoryPeriod = false;
                        },sleepTime);
                        refractoryPeriodStatus.inRefractoryPeriod = true

                    },message.isHealthyRun ?  message.healthy_cv : message.unhealthy_cv);
                }
                // Cell is in refractory period - cannot fire
                else
                {
                    // Cell is in refractory period - save UUID if blocked
                    if(cellInfo.isBlocked)
                    {
                        // Save UUID to detect reentry later
                        cellInfo.blockedUuid = message.uuid
                    }
                    // Visual feedback: darker gray overlay during refractory
                    greyOverlay("dimmedDarker")
                    setTimeout(()=> {
                        greyOverlay("dimmed")
                    },100);
                }
            }
        }
    }
}

/**
 * flashBody - Flashes the body background red to indicate cell firing
 *
 * This provides visual feedback when the cell enters the excited state.
 * The red flash lasts 500ms, then transitions to gray (refractory period).
 *
 * @param displayOberLay - Whether to show gray overlay after flash
 */
export function flashBody(displayOberLay: boolean = true)
{
    // Apply red background
    hideFireButton("animation_background_test")
    setTimeout(()=> {
        // Remove red background
        hideFireButton("")
        // Show gray overlay (refractory period)
        if(displayOberLay)
            greyOverlay("dimmed")
     }
    ,500);
}

/**
 * hideFireButton - Sets the body element's CSS class
 *
 * @param className - CSS class to apply to body
 */
function hideFireButton(className:string)
{
    const bg = document.getElementsByTagName('body')[0]
    if(bg!=null)
    {
        bg.className = className
    }
}

/**
 * greyOverlay - Sets the overlay div's CSS class
 *
 * Used to show gray overlay during refractory period.
 *
 * @param className - CSS class to apply ("dimmed", "dimmedDarker", or "")
 */
function greyOverlay(className:string)
{
    var overlayDiv = document.getElementById('overlay')
    if(overlayDiv!=null)
        overlayDiv.className = className
}

/**
 * buildCellRing - Constructs the circular ring topology
 *
 * This function creates a ring structure where each cell is connected to
 * its left and right neighbours in a circular fashion. This topology is
 * essential for simulating reentrant arrhythmias.
 *
 * For example, with cells [A, B, C, D]:
 * - A connects to B (right) and D (left)
 * - B connects to C (right) and A (left)
 * - C connects to D (right) and B (left)
 * - D connects to A (right) and C (left)
 *
 * @param cellsInRing - Ordered list of cells in the ring
 * @param channel - Ably channel for publishing
 */
function buildCellRing(cellsInRing:neighbourInterface[], channel:RealtimeChannel)
{
    let totalCellsInRing = cellsInRing.length;
    let cellNeighbours:neighbourInterface[] = [];

    // For each cell in the ring
    for(let i=0; i<totalCellsInRing; i++){
        cellNeighbours = [];
        let leftCell = null
        let rightCell  = null

        // Determine right neighbour (wrap around at end)
        if (i < totalCellsInRing-1)
            rightCell  = cellsInRing[i + 1]
        else
            rightCell  = cellsInRing[0] // Last cell connects to first

        // Determine left neighbour (wrap around at start)
        if (i > 0)
            leftCell  = cellsInRing[i - 1]
        else
            leftCell  = cellsInRing[totalCellsInRing-1] // First cell connects to last

        // Each cell has exactly 2 neighbours in ring topology
        cellNeighbours.push({uid:rightCell.uid, all:false})
        cellNeighbours.push({uid:leftCell.uid, all:false})

        // Send BuildCircling message to this cell
        let newMessage : messageInterface = {
            uuid: getRandomInt(1000000000),
            initialCellId: cellID,
            fromCellId: cellsInRing[i].uid,
            toCellIds: cellNeighbours,
            circlingCellIds: cellsInRing,
            action: ActionType.BuildCircling,
            fireTime: Date.now(),
            selectedActivity: null,
            blockedCellId: "",
            isHealthyRun: false,
            inReentryMode: false,
            healthy_cv: 0,
            unhealthy_cv: 0,
            healthy_rp: 0,
            unhealthy_rp: 0,
            modeName: "",
            levelName: ""
        }
        channel.publish(ACTION_NOTIFICATION, JSON.stringify(newMessage));
    };
}

/**
 * removeCellsFromRing - Removes cells from the ring topology
 *
 * Sends RemoveFromCircling messages to cells being removed from the ring.
 *
 * @param cellsToRemove - Cells to remove from ring
 * @param cellsInRing - Updated ring cell list (after removal)
 * @param channel - Ably channel for publishing
 */
function removeCellsFromRing(cellsToRemove:neighbourInterface[], cellsInRing:neighbourInterface[], channel:RealtimeChannel)
{
    for(let i=0; i<cellsToRemove.length; i++){
        let newMessage : messageInterface = {
            uuid: getRandomInt(1000000000),
            initialCellId: cellID,
            fromCellId: cellsToRemove[i].uid,
            toCellIds: [],
            circlingCellIds: cellsInRing,
            action: ActionType.RemoveFromCircling,
            fireTime: Date.now(),
            selectedActivity: null,
            blockedCellId: "",
            isHealthyRun: false,
            inReentryMode: false,
            healthy_cv: 0,
            unhealthy_cv: 0,
            healthy_rp: 0,
            unhealthy_rp: 0,
            modeName: "",
            levelName: ""
        }
        channel.publish(ACTION_NOTIFICATION, JSON.stringify(newMessage));
    }
}

/**
 * addNeighbours - Adds new neighbour connections
 *
 * Adds cells to the neighbours array and optionally publishes
 * AddNeighbour notifications to inform them of the connection.
 *
 * @param newNeighbours - Neighbours to add
 * @param doSetup - Whether to publish notifications
 * @param channel - Ably channel for publishing
 * @returns Promise that resolves when complete
 */
function addNeighbours(newNeighbours:neighbourInterface[], doSetup: boolean, channel:RealtimeChannel )
{
    return new Promise(() => {
        // Add to local neighbours array
        for(let i=0; i<newNeighbours.length; i++){
            let item = newNeighbours[i]
            neighbours.push(item)
        };

        // Notify new neighbours
        if(doSetup)
        {
            let newMessage : messageInterface = {
                uuid: getRandomInt(1000000000),
                initialCellId: cellID,
                fromCellId: cellID,
                toCellIds: newNeighbours,
                circlingCellIds: [],
                action: ActionType.AddNeighbour,
                fireTime: Date.now(),
                selectedActivity: null,
                blockedCellId: "",
                isHealthyRun: false,
                inReentryMode: false,
                healthy_cv: 0,
                unhealthy_cv: 0,
                healthy_rp: 0,
                unhealthy_rp: 0,
                modeName: "",
                levelName: ""
            }

            channel.publish(ACTION_NOTIFICATION, JSON.stringify(newMessage));
        }
    });
}

/**
 * removeItemFromArray - Removes a cell from an array by UID
 *
 * @param cellID - Cell UID to remove
 * @param cellArray - Array to remove from
 * @returns Promise that resolves when complete
 */
export function removeItemFromArray(cellID:string, cellArray:neighbourInterface[])
{
    return new Promise(() => {
        let index = cellArray.findIndex(d => d.uid === cellID);
        cellArray.splice(index, 1);
    });
}

/**
 * getRandomInt - Generates a random integer
 *
 * Used for generating unique message UUIDs.
 *
 * @param max - Maximum value (exclusive)
 * @returns Random integer from 0 to max-1
 */
export function getRandomInt(max:number) {
    return Math.floor(Math.random() * max);
  }

/**
 * httpPostNotification - Posts signal propagation data to backend server
 *
 * This function logs each signal propagation event to a backend database
 * for analysis and visualization. It captures:
 * - Signal UUID and timing
 * - Source and destination cells
 * - CV/RP values used
 * - Health status (healthy/blocked)
 * - Reentry detection
 *
 * Data is only collected for ring mode simulations (not neighbour or location mode).
 *
 * @param message - Signal message being processed
 * @param isSleeping - Whether cell is currently in refractory period
 * @param enterReentry - Whether reentry was detected
 */
export async function httpPostNotification(message:messageInterface, isSleeping:boolean, enterReentry: boolean){
    // Only collect data for ring run (not for neighbour or location mode)
    if (cellInfo.inRing)
    {
        // Build comma-separated list of ring cell IDs
        let circlingCellIds = ""
        message.circlingCellIds.forEach((item)=>
        {
            circlingCellIds = circlingCellIds + item.uid + ","
        });

        // Build comma-separated list of destination cell IDs (excluding sender)
        let toCellIds = ""
        neighbours.forEach((item)=>
        {
            if(item.uid != message.fromCellId)
            {
                toCellIds = toCellIds + item.uid + ","
            }
        });

        // Remove trailing comma
        toCellIds = toCellIds.endsWith(",") ? toCellIds.slice(0, -1) : toCellIds;

        // Prepare message for backend
        let postMessage:messagePostInterface =
        {
            uuid: message.uuid,
            cellId: cellID,
            initialCellId: message.initialCellId,
            fromCellId: message.fromCellId,
            toCellId: toCellIds,
            circlingCellIds: circlingCellIds,
            fireTime: message.fireTime,
            isHealthyRun: message.isHealthyRun,
            isBlocked: cellInfo.isBlocked,
            inReentryMode: enterReentry,
            cv_ms: cellInfo.isBlocked ? message.unhealthy_cv : message.healthy_cv,
            rp_ms: cellInfo.isBlocked ? message.unhealthy_rp : message.healthy_rp,
            modeName: message.modeName,
            levelName: message.levelName,
            isSleeping: isSleeping
        }

        console.log("postMessage")
        console.log(postMessage)

        // POST to backend API
        const res = await fetch(CELL_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(postMessage),
        });

        if (!res.ok) {
            console.error("Failed to save notification to DB");
        }
    }
}