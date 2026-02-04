import { PresenceMessage, RealtimeChannel } from "ably";
import { available_members, neighbours, cellID, notificationTrackingItems, neighbourInterface, messageInterface, circlingCells, refractoryPeriodStatus, activityInterface, cellInfo, messagePostInterface } from "../data/GlobalVariables";
import { ACTION_NOTIFICATION, CELL_API_URL, CHANNEL_SETUP } from "../data/Constants";

import { ActionType } from "../data/Enums";

import activityData from '../data/myocyteProperties.json';


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
        const foundActivity = foundMode.activities.find(a => a.activity_name === name)
        if(foundActivity != undefined)
        {
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


export async function refreshMembers(uid:string, action:ActionType, channel:RealtimeChannel){
    var presenceSet = await channel.presence.get();

    if (action === ActionType.DeleteMember)
    {
        removeMember(uid)
    }
    else
    {
        clearNeighbourArray(available_members)
        presenceSet.forEach(addMember);    
        
    //    presenceSet.map(addMember);    
    }
}

function addMember(item:PresenceMessage) {
    let memberExist = available_members.find(m=>m.uid === item.clientId);
    if (memberExist === undefined && item.clientId != cellID)
    {
        available_members.push({uid:item.clientId, all:false})
    }    
}

function removeMember(cellId:string) {
    // remove from members list
    let memberExist = available_members.find(m=>m.uid === cellId);
    if (memberExist != undefined)
    {
        removeItemFromArray(cellId, available_members).then(() => {
        })
    }    
}

export function clearNeighbourArray(inputArray:neighbourInterface[])
{
    let len = inputArray.length;
    for(let i=0; i< len; i++)
    {
        inputArray.pop();
    }
}

export function updateCellsInRing(selectedCells : neighbourInterface[], chanel:RealtimeChannel)
{
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
    // compare input UI selected cells with ring cells
    // Add New Neighbours
    let deletingCellsFromRing : neighbourInterface[] = []
    for(let i=0; i<circlingCells.length; i++){     
        let item = circlingCells[i]
        if(selectedCells.find(n=>n.uid == item.uid) === undefined)
        {
            hasChanges = true;

            let leftNeighbour : neighbourInterface | null  = null// update neighbours
            let rightNeighbour : neighbourInterface | null  = null// update neighbours

            if (i === circlingCells.length - 1)
            {
                rightNeighbour = circlingCells[0]
            }
            else
            {
                rightNeighbour = circlingCells[i + 1]
            }

            leftNeighbour = circlingCells[i - 1]

            chanel.publish(CHANNEL_SETUP,"removeneighbour,"+item.uid+","+leftNeighbour.uid); //only calls publish if generated locally
            chanel.publish(CHANNEL_SETUP,"removeneighbour,"+leftNeighbour.uid+","+item.uid); //only calls publish if generated locally
        
            chanel.publish(CHANNEL_SETUP,"removeneighbour,"+item.uid+","+rightNeighbour.uid); //only calls publish if generated locally
            chanel.publish(CHANNEL_SETUP,"removeneighbour,"+rightNeighbour.uid+","+item.uid); //only calls publish if generated locally

            removeItemFromArray(item.uid, circlingCells)
            deletingCellsFromRing.push({uid:item.uid, all:false})
        }
    }
    
    if(deletingCellsFromRing.length > 0)
        removeCellsFromRing(deletingCellsFromRing, circlingCells, chanel)

    
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

        if(hasChanges)
        {
            buildCellRing(selectedCells, chanel);
        }
    }
        
}

export function updateNeighbours(selectedNeighbours : neighbourInterface[], doSetup: boolean, channel:RealtimeChannel )
{
    // compare input UI selectedNeighbours with neighbours
    // Add New Neighoubours
    let newNeighbours : neighbourInterface[] = []
    for(let i=0; i<selectedNeighbours.length; i++){   
        let item = selectedNeighbours[i];
    
        if(!neighbours.find(n=>n.uid == item.uid))   
        {
            // can not find selected cellid from neighbours, add it to neighbours
            newNeighbours.push({uid:item.uid, all:false})
        }
    }

    let canContinue: boolean = false;
    if(newNeighbours.length > 0){
        addNeighbours(newNeighbours, doSetup, channel).then(() => {
            canContinue = true;
        });
    }
    else{
        canContinue = true;
    }

    if (canContinue)
    {
        let deletingNeighbours : neighbourInterface[] = []

        for(let i=0; i<neighbours.length; i++){     
            let item = neighbours[i]
            if(selectedNeighbours.find(n=>n.uid == item.uid) === undefined)
            {
                deletingNeighbours.push({uid:item.uid, all:false})
            }
        }

        if (deletingNeighbours.length > 0)
            removeNeighbours(deletingNeighbours, doSetup, channel)
    };
}

function removeNeighbours(deletingNeighbours:neighbourInterface[], doSetup: boolean, channel:RealtimeChannel){
    for(let i=0; i<deletingNeighbours.length; i++){
        let item = deletingNeighbours[i];
        //channel.unsubscribe(item.uid);
        removeItemFromArray(item.uid, neighbours).then(() => {});
    };
    
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

export function notificationHandler(message : messageInterface, isInitialFire: boolean, channel:RealtimeChannel)
{
    let findUuidResult = notificationTrackingItems.find(n=>n.uuid === message.uuid)
    if(findUuidResult === undefined ||  message.inReentryMode) // haven't processed notification, or in inReentry Mode
    {
        
        if(message.fromCellId != cellID || isInitialFire) // not from itself, unless it's initial firing
        {
            if(message.toCellIds.find(m=>m.uid === cellID) != undefined || isInitialFire) // only forward when refractory period is over
            {
                if(!refractoryPeriodStatus.inRefractoryPeriod ||  message.inReentryMode) // I am in the tocell, or I am initial firing
                {                    
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
                    
                    setTimeout(()=> { // simulate conduction velocity
                        let newToCellIds: neighbourInterface[] = [];
                        for(let i=0; i<neighbours.length; i++){     
                            let item = neighbours[i]
                            if(item.uid != message.fromCellId) // Don't send back to sender
                            {
                                if(message.toCellIds.find(n=>n.uid === item.uid) === undefined || isInitialFire) // not duplicate sending if it's sent from parent
                                {
                                    newToCellIds.push({uid : item.uid, all:false})
                                }
                            }
                        };
                        
                        notificationTrackingItems.push({uuid: message.uuid});
                        channel.publish("events", "fire,"+cellID+","+Date.now()+","+sleepTime); // used to notify the control page, includes RP duration
                        flashBody();
                     
                        let gotoReentryMode = false;
                        if(cellInfo.isBlocked)
                        {
                            if(cellInfo.blockedUuid === message.uuid ) // enter retry when message from original uuid reached after rp is over
                            {
                                gotoReentryMode = true;
                            }
                        }

                        if(!message.inReentryMode) // save receied message while sleeping
                        {
                            httpPostNotification(message, false, gotoReentryMode)
                        }

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

                            // Fix: Removed duplicate "events" publish - already published at line 331
                            // This was causing duplicate event notifications to the control page
                        }
                        cellInfo.inRefractoryPeriod = true
                        
                        setTimeout(()=> {   // simulate refractory period
                            greyOverlay("")
                            refractoryPeriodStatus.inRefractoryPeriod = false;
                        },sleepTime);
                        refractoryPeriodStatus.inRefractoryPeriod = true
                    },message.isHealthyRun ?  message.healthy_cv : message.unhealthy_cv);
                }
                else
                {
                    if(cellInfo.isBlocked)
                    {
                        cellInfo.blockedUuid = message.uuid
                    }
                    greyOverlay("dimmedDarker")
                    setTimeout(()=> {   // simulate refractory period
                        greyOverlay("dimmed")
                    },100);
                }
            }
        }
    }
}

export function flashBody(displayOberLay: boolean = true)
{
    hideFireButton("animation_background_test")
    setTimeout(()=> {
        hideFireButton("")
        if(displayOberLay)
            greyOverlay("dimmed")
     }
    ,500);
}

function hideFireButton(className:string)
{
    const bg = document.getElementsByTagName('body')[0] 
    if(bg!=null)
    {
        bg.className = className
    }
}

function greyOverlay(className:string)
{
    var overlayDiv = document.getElementById('overlay')
    if(overlayDiv!=null)
        overlayDiv.className = className
}

function buildCellRing(cellsInRing:neighbourInterface[], channel:RealtimeChannel)
{
    let totalCellsInRing = cellsInRing.length;
    let cellNeighbours:neighbourInterface[] = [];
    for(let i=0; i<totalCellsInRing; i++){     
        cellNeighbours = [];
        let leftCell = null
        let rightCell  = null

        if (i < totalCellsInRing-1)
            rightCell  = cellsInRing[i + 1]
        else
            rightCell  = cellsInRing[0]

        if (i > 0)
            leftCell  = cellsInRing[i - 1]
        else
            leftCell  = cellsInRing[totalCellsInRing-1]

        cellNeighbours.push({uid:rightCell.uid, all:false})
        cellNeighbours.push({uid:leftCell.uid, all:false})

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

function addNeighbours(newNeighbours:neighbourInterface[], doSetup: boolean, channel:RealtimeChannel )
{
    return new Promise(() => {
        for(let i=0; i<newNeighbours.length; i++){     
            let item = newNeighbours[i]
            neighbours.push(item)
        };
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

export function removeItemFromArray(cellID:string, cellArray:neighbourInterface[])
{
    return new Promise(() => {
        let index = cellArray.findIndex(d => d.uid === cellID); //find index in your array
        cellArray.splice(index, 1);//remove element from array
    });
}

export function getRandomInt(max:number) {
    return Math.floor(Math.random() * max);
  }

export async function httpPostNotification(message:messageInterface, isSleeping:boolean, enterReentry: boolean){
    if (cellInfo.inRing)  // Only collect data for ring run
    {
        let circlingCellIds = ""
        message.circlingCellIds.forEach((item)=>
        {
            circlingCellIds = circlingCellIds + item.uid + ","
        });

        let toCellIds = ""
        neighbours.forEach((item)=>
        {
            if(item.uid != message.fromCellId)
            {
                toCellIds = toCellIds + item.uid + ","
            }
        });

        toCellIds = toCellIds.endsWith(",") ? toCellIds.slice(0, -1) : toCellIds;

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