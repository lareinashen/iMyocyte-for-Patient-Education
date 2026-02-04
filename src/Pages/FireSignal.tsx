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

interface FireSignalPros{
    cellList : neighbourInterface[]
    neighbourList: neighbourInterface[]
}

const FireSignal = ({cellList, neighbourList} : FireSignalPros) => {
    const { setRunningInfo } = useRunningInfo();
    const { channel } = useChannel({ channelName: CHANNEL_NAME }, () => {
    })
    
    const [isHealthy, setIsHealthy] = React.useState(true);
    const [isNoSympathetic, setIsNoSympathetic] = React.useState(true);
    let selectedActivity: activityInterface | null =  getActivityByName("rest","NoSympatheticActivation");
    let blockedCellList = [...cellList]
    removeItemFromArray(cellID, blockedCellList)
    let endTime = Date.now()

    const handleNext = () => {
        let activityName = "rest"
        
        
        let waitingTime = Date.now() - endTime

        if(waitingTime <= 3000 )
        {
            activityName = "sprinting"
        }
        else if(waitingTime <= 5000 )
        {
            activityName = "jogging"
        }
        else if(waitingTime <= 7000 )
        {
            activityName = "walking"
        }
        else
        {
            activityName = "rest"
        }
       
        let runningActivity = getActivityByName(activityName, isNoSympathetic?"NoSympatheticActivation":"SympatheticActivation")

        if(runningActivity != null)
        {
            activityName = activityName.charAt(0).toUpperCase() + activityName.slice(1);
            let modeDisplayName = isNoSympathetic?"No Sympathetic Activation":"Sympathetic Activation"
            setRunningInfo({cvValue: runningActivity.cv_healthy_value, rpValue: runningActivity.rp_healthy_value, modeName:modeDisplayName , levelName:activityName, inReentry:false})
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
            notificationHandler(newMessage, true, channel)  		          
            
            if(fireButtonRef.current != null)
                fireButtonRef.current.style.visibility = "hidden"

            setTimeout(()=> {
                if(fireButtonRef.current != null){
                    fireButtonRef.current.style.visibility = "visible"
                    endTime = Date.now()
                }
            },isHealthy ? runningActivity.rp_healthy_value : (cellInfo.isBlocked ? runningActivity.rp_unhealthy_value : runningActivity.rp_healthy_value) );
        }
    }
        
    const handleModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setIsNoSympathetic(
            event.target.checked,
        );
    };

    const handleHealthyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setIsHealthy(
            event.target.checked,
        );

        if(selectedActivity != null)
        {
            if(event.target.checked)
            {
                sendSettingsChangedNotification(selectedActivity, event.target.checked, null, channel)
            }
            else
            {
                let blockedCell:neighbourInterface = neighbourList[0]
                sendSettingsChangedNotification(selectedActivity, isHealthy, blockedCell, channel)
            }
        }
    };
        
    const fireButtonRef = useRef<HTMLAnchorElement | null>(null);
    
    
    function getRenderContents()
    {
        if(cellInfo.inRing && cellInfo.isMaster)
        {
            return(
                <Box>
                    {/* Ring Diagram */}
                    <RingDiagram
                        cellList={cellList}
                        blockedCellId={blockedCellList.length > 0 && !isHealthy ? blockedCellList[0].uid : ""}
                    />

                    <div className="pt-2"></div>
                    <Grid container spacing={2}>
                        <FormControlLabel
                            control={<Checkbox checked={isNoSympathetic}  onChange={handleModeChange} />}
                            label="No Sympathetic Activation" />
                        <FormControlLabel
                            control={<Checkbox checked={isHealthy}  onChange={handleHealthyChange} />}
                            label="Healthy" />
                    </Grid>

                    <div className="pt-2"></div>
                    <div className="col s2 offset-s5"><a ref={fireButtonRef} onClick={handleNext} className="btn-floating btn-large pulse red lighten-2" id='fire_button_master'><i className="material-icons left">sunny</i>fire</a></div>
                </Box>

            );
        }
        else
        {
            return(
                <div className="col s2 offset-s5"><a ref={fireButtonRef} onClick={handleNext} className="btn-floating btn-large pulse red lighten-2" id='fire_button_regular'><i className="material-icons left">sunny</i>fire</a></div>
            );
        }
    }

    return (
        <div>
            <RunningInfoSubPage cellList={cellList} neighbourList={neighbourList}  />
            <div className="pt-2"></div>
            {getRenderContents()}
            
        </div>
    );
}

export default FireSignal