import * as React from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepContent from '@mui/material/StepContent';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import ChooseMode from '../Pages/ChooseMode';
import AddNeighbour from '../Pages/NeighbourMode';
import RunningInfo from './RunningInfo';
import AddNeighbourRing from './NeighbourRingMode';
import LocationMode from '../Pages/LocationMode';
import FireSignal from '../Pages/FireSignal';
import { SimulationMode, ActionType } from '../data/Enums';
import { updateNeighbours, removeItemFromArray, refreshMembers, updateCellsInRing, clearNeighbourArray, notificationHandler, getRandomInt } from '../Services/SharedFunctions';
import { cellID, neighbourInterface, messageInterface, available_members, SiblingChangedInterface , cellInfo, neighbours, circlingCells, changesTrackingItems} from '../data/GlobalVariables'
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useRunningInfo } from '../data/CountContext';

import '../assets/css/style.css';
import { useChannel, usePresence, usePresenceListener } from 'ably/react';
import { CHANNEL_ENTER, CHANNEL_LEAVE, CHANNEL_NAME, CHANNEL_SETUP, ACTION_NOTIFICATION } from '../data/Constants';

const steps = [
  {
    key: "Select_Simulation_Mode",
    label: 'Select Simulation Mode',
    index: 1  
  },
  {
    key: "CA_setup",
    label: ' Setup',
    index: 2,
  },
  {
    key: "Fire_Signal",
    label: 'Fire Signal',
    index: 3
  },
];

function Steps() {
  const {runningInfo, setRunningInfo } = useRunningInfo();
  
  const [siblingNeigbour, setSiblingNeigbour] = React.useState <SiblingChangedInterface> ({changed:false, message:null});

  const { channel } = useChannel({ channelName: CHANNEL_NAME }, (messageBody) => {
    if(messageBody.name === ACTION_NOTIFICATION)
    {
    let message : messageInterface = JSON.parse(messageBody.data)
    
    if (message.action === ActionType.AddNeighbour || message.action === ActionType.DeleteNeighbour)
        {
          if(message.toCellIds.find(c=>c.uid === cellID) && message.fromCellId != cellID)
          {
            setSiblingNeigbour({changed: true, message: message})
            
          }
        }
        else if( message.action === ActionType.SettingsChanged)
        {
          if(message.toCellIds.find(c=>c.uid === cellID))
            {
              setSiblingNeigbour({changed: true, message: message})
              
            }
        }
        else if(message.action === ActionType.BuildCircling || message.action === ActionType.RemoveFromCircling)
        {
          if(message.fromCellId == cellID)
            {
              setSiblingNeigbour({changed: true, message: message})
            }
        }
        else if(message.action === ActionType.FireNotification)
        {  
          if(message.toCellIds.find(c=>c.uid === cellID) && message.fromCellId != cellID)
            {
              setSiblingNeigbour({changed: true, message: message})
              notificationHandler(message, false, channel);
            }   
        }
      }
  });

  usePresence({ channelName: CHANNEL_NAME }, { foo: 'bar1' });  
  usePresenceListener({ channelName: CHANNEL_NAME }, (message) => {
    if(message.action === CHANNEL_LEAVE)
    {
      let uid  = message.clientId

      let siblingMsg : messageInterface = {
        uuid: getRandomInt(1000000000),
        initialCellId: uid,
        fromCellId: uid,
        toCellIds: [{ uid: uid, all: false }],
        circlingCellIds: [],
        action: ActionType.DeleteMember,
        fireTime: Date.now(),
        selectedActivity: null,
        blockedCellId: "",
        isHealthyRun: false,
        inReentryMode: false,
        healthy_cv: 0,
        unhealthy_cv: 0,
        healthy_rp: 0,
        unhealthy_rp: 0,
        modeName: '',
        levelName: ''
      }
          setSiblingNeigbour({changed: true, message: siblingMsg})
    }
    else if(message.action === CHANNEL_ENTER)
      {
        refreshMembers(message.clientId, ActionType.AddMember, channel)    
      }
    
  });

  const [myNeighbours, setMyNeighbours] = React.useState <neighbourInterface[]> ([]);
  const [cellsInRing, setCellsInRing] = React.useState <neighbourInterface[]> ([]);
  const [activeStep, setActiveStep] = React.useState(0);
  
  const [selectedMode, setSelectedMode] = React.useState({
    mode: SimulationMode.None
  });
  
  const updateMode = (mode:SimulationMode) => {
    setSelectedMode({
      mode
    });
  }
  if(siblingNeigbour.changed)
  {
    let addSiblingMsg : messageInterface = siblingNeigbour.message as messageInterface;

    let getHasProcessedResult = changesTrackingItems.find(n=>n.uuid === addSiblingMsg.uuid)
    if(getHasProcessedResult === undefined)
    {
      changesTrackingItems.push({uuid: addSiblingMsg.uuid});

      if(addSiblingMsg != undefined)
        {
          if(addSiblingMsg.action != ActionType.FireNotification)
          {
              if(addSiblingMsg.action === ActionType.SettingsChanged)
              {
                cellInfo.isBlocked = addSiblingMsg.blockedCellId === cellID;            
              }
              else if(addSiblingMsg.action === ActionType.BuildCircling)
              {
                siblingNeigbour.changed = false
                cellInfo.ringMasterCellId = addSiblingMsg.initialCellId
                if (addSiblingMsg.initialCellId === cellID)
                {
                  cellInfo.isMaster = true;
                }
                else
                {
                  cellInfo.isMaster = false;
                }
    
                if (addSiblingMsg.fromCellId === cellID && addSiblingMsg.circlingCellIds.length > 0)
                {
                  cellInfo.inRing = true;
                  clearNeighbourArray(cellsInRing)
                  let newCells:neighbourInterface[] = cellsInRing
                  addSiblingMsg.circlingCellIds.forEach((item)=>{
                    let existedCell = newCells.find(n=>n.uid === item.uid);
                    if( existedCell === undefined)
                    {
                      newCells.push(
                        {
                          uid:item.uid,
                          all:item.all
                        }
                      )
                  }
                  })
                  
                  // update CellsInRing
                  clearNeighbourArray(circlingCells)
                  cellsInRing.forEach((item) => {
                    circlingCells.push({uid:item.uid, all:item.all})
                  })
    
                  // update neighbours
                  neighbours.forEach((item) => {
                    channel.publish(CHANNEL_SETUP,"removeneighbour,"+item.uid+","+cellID); //only calls publish if generated locally
                  })
                  
                  clearNeighbourArray(neighbours)
                  clearNeighbourArray(myNeighbours)
                  let newNeighbours:neighbourInterface[] = myNeighbours
                  addSiblingMsg.toCellIds.forEach ((item)=>{
                    let existedCell = newNeighbours.find(n=>n.uid === item.uid);
                    if( existedCell === undefined)
                    {
                      newNeighbours.push(
                        {
                          uid:item.uid,
                          all:item.all
                        }
                      )
    
                      neighbours.push(
                        {
                          uid:item.uid,
                          all:item.all
                        }
                      )
                      channel.publish(CHANNEL_SETUP,"addneighbour,"+item.uid+","+cellID + "," + Date.now());
                    }
                  });
                  
                  updateNeighbours(newNeighbours, false, channel)
                }
              }
              else if(addSiblingMsg.action === ActionType.RemoveFromCircling)
              {
                if(addSiblingMsg.fromCellId === cellID && addSiblingMsg.initialCellId != cellID) // leader removes an cell (cannot be itself) from ring
                {
                  cellInfo.ringMasterCellId = "";
                  cellInfo.inRing = false;
                  cellInfo.isMaster = true;
                  
                  // update CellsInRing
                  clearNeighbourArray(circlingCells)
                  cellsInRing.forEach((item) => {
                    circlingCells.push({uid:item.uid, all:item.all})
                  })
    
                  clearNeighbourArray(myNeighbours)
                  updateNeighbours([], false, channel)
                }
              }
              else
              {
                let fromcellId = addSiblingMsg.fromCellId
                let fromCell = available_members.find(n=>n.uid === fromcellId)
    
                if (fromCell != undefined)
                {
                  let existCell = myNeighbours.find(n=>n.uid === fromcellId)
                  let newCells:neighbourInterface[] = myNeighbours
                  if(addSiblingMsg.action === ActionType.AddNeighbour)
                  {
                    
                    // add sibling neighbour
                    if(existCell === undefined)
                    {
                      channel.publish(CHANNEL_SETUP,"addneighbour,"+fromCell.uid+","+cellID + "," + Date.now());
                      newCells.push(fromCell)
                      updateNeighbours(newCells, false, channel)
                      setMyNeighbours(newCells)
                    }
                  }
                  else if(addSiblingMsg.action === ActionType.DeleteNeighbour)
                  {
                    if(existCell != undefined)
                      {
                        if(addSiblingMsg.circlingCellIds.length > 0){
                          newCells = []
                        }
                        
                        channel.publish(CHANNEL_SETUP,"removeneighbour,"+fromcellId+","+cellID);

                        removeItemFromArray(fromcellId, newCells).then(() => {});
                        updateNeighbours(newCells, false, channel)
                        setMyNeighbours(newCells)
                      }  
                  }
                  else if(addSiblingMsg.action === ActionType.DeleteMember)
                    {
                      
                      //refreshMembers(fromcellId, ActionType.DeleteMember, channel)
                      
                      if(cellInfo.inRing)
                      {
                        if(cellInfo.ringMasterCellId === fromCell.uid) // Need to stop ring when the leader cell leaves
                        {
                          cellInfo.ringMasterCellId = "";
                          cellInfo.inRing = false;
                          cellInfo.isBlocked = false;
                          cellInfo.isMaster = true;

                          myNeighbours.forEach((item)=>{
                            channel.publish(CHANNEL_SETUP,"removeneighbour,"+item.uid+","+cellID); //only calls publish if generated locally
                            channel.publish(CHANNEL_SETUP,"removeneighbour,"+cellID+","+item.uid); //only calls publish if generated locally
                          })
                          
                          clearNeighbourArray(cellsInRing)
                          clearNeighbourArray(myNeighbours)
                          updateNeighbours([], false, channel)
                        }
                        else
                        { // Need to rebuild ring when a cell leaves
                          if(cellInfo.ringMasterCellId === cellID) // only master cell has power to rebuild cell
                          {
                            if(cellsInRing.find(c=>c.uid == fromCell.uid) != undefined)
                            {
                              removeItemFromArray(fromCell.uid, cellsInRing)
                              updateCellsInRing(cellsInRing, channel)
                            }
                          }
                        }
                      }
                      else
                      {
                        if(existCell != undefined)
                          {
                            removeItemFromArray(fromcellId, newCells).then(() => {});
                            updateNeighbours(newCells, false, channel)
                            setMyNeighbours(newCells)
              
                            if(addSiblingMsg.action === ActionType.DeleteMember)
                            {
                              refreshMembers(fromcellId, ActionType.DeleteMember, channel)
                            }
                          }  
                      }
                    }
                }
            }
          }
          else
          {
            if(addSiblingMsg.toCellIds.find(c=>c.uid === cellID) != undefined)
            {
              setRunningInfo(
                {
                  cvValue: cellInfo.isBlocked ? addSiblingMsg.unhealthy_cv : addSiblingMsg.healthy_cv, 
                  rpValue: cellInfo.isBlocked ? addSiblingMsg.unhealthy_rp : addSiblingMsg.healthy_rp,
                  modeName: addSiblingMsg.modeName,
                  levelName: addSiblingMsg.levelName,
                  inReentry: addSiblingMsg.inReentryMode
                })
            }
          }
        }
    }
  }

    const handleNext = () => {
      if(activeStep === 1)
      {
        updateNeighbours(myNeighbours, true, channel)
        if (selectedMode.mode == SimulationMode.NeighbourRing)
        {
          updateCellsInRing(cellsInRing, channel)
        }
      }
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };
  
    const handleBack = () => {
      setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };
  
    const handleReset = () => {
      setActiveStep(0);
    };

    function get_step_label(index: number, label: string)
    {
      let modelDisplayName = ""
      if(selectedMode.mode === SimulationMode.Neighbour)
      {
        modelDisplayName = "Neighbour "
      }
      else if(selectedMode.mode === SimulationMode.Location)
        {
          modelDisplayName = "Location "
        }
      else if(selectedMode.mode === SimulationMode.NeighbourRing)
          {
            modelDisplayName = "Neighbour Ring "
          }
      return index != 1 ? label : modelDisplayName.concat(label)
    }

    const getConponents = (index:number) => {
        if (index === 0)
        {
          let modelDisplayName = ""
          if(selectedMode.mode === SimulationMode.Neighbour)
            {
              modelDisplayName = "Neighbour Mode"
            }
            else if(selectedMode.mode === SimulationMode.Location)
            {
              modelDisplayName = "Location Mode"
            }
            else if(selectedMode.mode === SimulationMode.NeighbourRing)
            {
              modelDisplayName = "Neighbour Ring Mode"
            }
            return (
                <ChooseMode onData={updateMode} currentMode = {modelDisplayName}></ChooseMode>);
        }
        else if (index === 1){
              if(selectedMode.mode === SimulationMode.Neighbour)
              {
                channel.unsubscribe("activeCA");
                return (<AddNeighbour currentNeighbours = {myNeighbours} setMyNeighbours={setMyNeighbours}></AddNeighbour>);
              }
              else if(selectedMode.mode === SimulationMode.NeighbourRing)
                {
                  channel.unsubscribe("activeCA");
                  return (<AddNeighbourRing currentNeighbours = {myNeighbours} cellsInRing = {cellsInRing} setRingCells={setCellsInRing}></AddNeighbourRing>);
                }
              else
              {
                 return (<LocationMode />) ;
              }
        }
        else{

            return (
                <FireSignal cellList={cellsInRing} neighbourList={myNeighbours} />
            );
        }

      };

      function getRenderContent()
      {
        if(cellInfo.isMaster)
        {
          return(
            <div>
              <Dialog
                        open={runningInfo != null? runningInfo.inReentry : false}
                        PaperProps={{
                        component: 'form',
                        sx: { backgroundImage: 'none', backgroundColor: cellInfo.isBlocked ? "lightgray" : "none"  },
                        }}>
                        <DialogContent
                            sx={{ display: 'flex', backgroundColor:"#ffb3b2", flexDirection: 'column', gap: 2, minWidth: '200px', minHeight:"200px" }}>
                            You are in reentry now
                        </DialogContent>
                    </Dialog>

            <Stepper activeStep={activeStep} orientation="vertical">
              {steps.map((step, index) => (
                <Step key={step.key}>
                  <StepLabel
                    optional={
                      index === steps.length + 1 ? (
                        <Typography variant="caption">Last step</Typography>
                      ) : null
                    }
                  >
                    
                    {get_step_label(index, step.label)}
                  </StepLabel>
                  <StepContent>
                    {getConponents(index)}
                    
                    <Box sx={{ mb: 2 }}>
                      <Button
                        disabled={selectedMode.mode === SimulationMode.None || (index === 1 && selectedMode.mode === SimulationMode.NeighbourRing && cellsInRing.length < 5 )}
                        style={
                          { display: index === steps.length - 1 || (index === 1 && selectedMode.mode === SimulationMode.Location) ? 'none' : 'default'}
                        }
                        variant="contained"
                        onClick={handleNext}
                        sx={{ mt: 1, mr: 1 }}
                      >
                        {index === steps.length - 1 ? 'Finish' : 'Continue'}
                      </Button>
                      <Button
                        disabled={index === 0}
                        onClick={handleBack}
                        sx={{ mt: 1, mr: 1 }}
                      >
                        Back
                      </Button>
                    </Box>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
            </div>
          );
        }
        else
        {  
          return(
            <RunningInfo cellList={cellsInRing} neighbourList={myNeighbours} />
          )
        }
      }
    return (
      
      <Dialog
      open={true}
      PaperProps={{
        component: 'form',
        sx: { backgroundImage: 'none', backgroundColor: cellInfo.isBlocked ? "lightgray" : "none"  },
      }}
    ><div id="overlay">
      <DialogTitle>Your UID: {cellID}</DialogTitle>
      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: '375px', minHeight:"700px" }}
      >
        {getRenderContent()}
        {activeStep === steps.length && (
          <Paper square elevation={0} sx={{ p: 3 }}>
            <Typography>All steps completed - you&apos;re finished</Typography>
            <Button onClick={handleReset} sx={{ mt: 1, mr: 1 }}>
              Reset
            </Button>
          </Paper>
        )}
      </DialogContent></div></Dialog>
    );
};

export default Steps;