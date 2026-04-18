/**
 * Steps Component - Main Stepper Coordinator
 *
 * This is the central component that orchestrates the entire simulation flow.
 * It manages a 3-step process:
 *
 * Step 1: Select Simulation Mode
 *   - Choose between Neighbour, Location, or Neighbour Ring mode
 *
 * Step 2: Setup
 *   - Configure neighbours or position based on selected mode
 *   - For Ring mode: select cells to form the ring
 *
 * Step 3: Fire Signal
 *   - Fire signals to propagate through the network
 *   - View real-time visualization and cell states
 *
 * This component also handles:
 * - Real-time message synchronization via Ably
 * - Presence tracking (detecting when cells join/leave)
 * - Neighbour relationship management
 * - Ring topology coordination
 * - Dialog notifications for important events
 */

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

/**
 * steps - Configuration for the 3-step simulation process
 */
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

/**
 * Steps Component
 * Main coordinator for the simulation stepper interface
 */
function Steps() {
  // Access to running info context for CV/RP values
  const {runningInfo, setRunningInfo } = useRunningInfo();

  // State: Tracks incoming messages from other cells that need processing
  const [siblingNeigbour, setSiblingNeigbour] = React.useState <SiblingChangedInterface> ({changed:false, message:null});

  /**
   * Subscribe to Ably channel and handle incoming messages
   *
   * Message types handled:
   * - AddNeighbour/DeleteNeighbour: Another cell added/removed this cell as neighbour
   * - SettingsChanged: Ring settings changed (healthy/unhealthy mode)
   * - BuildCircling/RemoveFromCircling: Ring topology changes
   * - FireNotification: Signal propagation from another cell
   */
  const { channel } = useChannel({ channelName: CHANNEL_NAME }, (messageBody) => {
    if(messageBody.name === ACTION_NOTIFICATION)
    {
    let message : messageInterface = JSON.parse(messageBody.data)

    // Handle neighbour add/delete notifications
    if (message.action === ActionType.AddNeighbour || message.action === ActionType.DeleteNeighbour)
        {
          // Only process if this cell is in the recipient list and not the sender
          if(message.toCellIds.find(c=>c.uid === cellID) && message.fromCellId != cellID)
          {
            setSiblingNeigbour({changed: true, message: message})

          }
        }
        // Handle settings changed notifications (healthy/unhealthy mode)
        else if( message.action === ActionType.SettingsChanged)
        {
          if(message.toCellIds.find(c=>c.uid === cellID))
            {
              setSiblingNeigbour({changed: true, message: message})

            }
        }
        // Handle ring topology changes
        else if(message.action === ActionType.BuildCircling || message.action === ActionType.RemoveFromCircling)
        {
          // Only process if this cell initiated the change
          if(message.fromCellId == cellID)
            {
              setSiblingNeigbour({changed: true, message: message})
            }
        }
        // Handle fire notifications (signal propagation)
        else if(message.action === ActionType.FireNotification)
        {
          // Only process if this cell is a recipient and not the sender
          if(message.toCellIds.find(c=>c.uid === cellID) && message.fromCellId != cellID)
            {
              setSiblingNeigbour({changed: true, message: message})
              // Process the notification (flash body, propagate to neighbours)
              notificationHandler(message, false, channel);
            }
        }
      }
  });

  /**
   * Track presence on the Ably channel
   * This allows detecting when cells join or leave the simulation
   */
  usePresence({ channelName: CHANNEL_NAME }, { foo: 'bar1' });

  /**
   * Listen for presence events (cells joining/leaving)
   *
   * When a cell leaves:
   * - Create a DeleteMember message
   * - Remove the cell from available_members and neighbour lists
   *
   * When a cell joins:
   * - Add the cell to available_members
   */
  usePresenceListener({ channelName: CHANNEL_NAME }, (message) => {
    if(message.action === CHANNEL_LEAVE)
    {
      let uid  = message.clientId

      // Create a DeleteMember message for the leaving cell
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
        // Add the new cell to available_members
        refreshMembers(message.clientId, ActionType.AddMember, channel)
      }

  });

  // State: Selected neighbours for Neighbour mode
  const [myNeighbours, setMyNeighbours] = React.useState <neighbourInterface[]> ([]);

  // State: Selected cells for Ring mode
  const [cellsInRing, setCellsInRing] = React.useState <neighbourInterface[]> ([]);

  // State: Current step in the stepper (0, 1, or 2)
  const [activeStep, setActiveStep] = React.useState(0);

  // State: Selected simulation mode
  const [selectedMode, setSelectedMode] = React.useState({
    mode: SimulationMode.None
  });

  /**
   * updateMode - Updates the selected simulation mode
   * @param mode - The new simulation mode
   */
  const updateMode = (mode:SimulationMode) => {
    setSelectedMode({
      mode
    });
  }
  /**
   * Process incoming messages from other cells
   *
   * This section handles all message types and updates local state accordingly.
   * Uses a tracking system to prevent duplicate processing of the same message.
   */
  if(siblingNeigbour.changed)
  {
    let addSiblingMsg : messageInterface = siblingNeigbour.message as messageInterface;

    // Check if this message has already been processed (prevent duplicates)
    let getHasProcessedResult = changesTrackingItems.find(n=>n.uuid === addSiblingMsg.uuid)
    if(getHasProcessedResult === undefined)
    {
      // Mark this message as processed
      changesTrackingItems.push({uuid: addSiblingMsg.uuid});

      if(addSiblingMsg != undefined)
        {
          // Skip fire notifications (already handled in channel subscription)
          if(addSiblingMsg.action != ActionType.FireNotification)
          {
              /**
               * Handle SettingsChanged: Update whether this cell is blocked
               */
              if(addSiblingMsg.action === ActionType.SettingsChanged)
              {
                cellInfo.isBlocked = addSiblingMsg.blockedCellId === cellID;
              }
              /**
               * Handle BuildCircling: Set up ring topology
               *
               * This is sent when the master cell finalizes the ring.
               * All cells in the ring receive this message and update their state.
               */
              else if(addSiblingMsg.action === ActionType.BuildCircling)
              {
                siblingNeigbour.changed = false

                // Set the ring master cell ID
                cellInfo.ringMasterCellId = addSiblingMsg.initialCellId

                // Determine if this cell is the master
                if (addSiblingMsg.initialCellId === cellID)
                {
                  cellInfo.isMaster = true;
                }
                else
                {
                  cellInfo.isMaster = false;
                }

                // If this cell initiated the ring and has cells in it
                if (addSiblingMsg.fromCellId === cellID && addSiblingMsg.circlingCellIds.length > 0)
                {
                  cellInfo.inRing = true;

                  // Update local cellsInRing state
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

                  // Update global circlingCells array
                  clearNeighbourArray(circlingCells)
                  cellsInRing.forEach((item) => {
                    circlingCells.push({uid:item.uid, all:item.all})
                  })

                  // Remove old neighbours (ring replaces neighbour mode)
                  neighbours.forEach((item) => {
                    channel.publish(CHANNEL_SETUP,"removeneighbour,"+item.uid+","+cellID);
                  })

                  // Set up new neighbours based on ring topology
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
                      // Notify the neighbour that they've been added
                      channel.publish(CHANNEL_SETUP,"addneighbour,"+item.uid+","+cellID + "," + Date.now());
                    }
                  });

                  // Update neighbours and notify other cells
                  updateNeighbours(newNeighbours, false, channel)
                }
              }
              /**
               * Handle RemoveFromCircling: Cell removed from ring
               */
              else if(addSiblingMsg.action === ActionType.RemoveFromCircling)
              {
                // Leader removes a cell (cannot be itself) from ring
                if(addSiblingMsg.fromCellId === cellID && addSiblingMsg.initialCellId != cellID)
                {
                  cellInfo.ringMasterCellId = "";
                  cellInfo.inRing = false;
                  cellInfo.isMaster = true;

                  // Update global circlingCells array
                  clearNeighbourArray(circlingCells)
                  cellsInRing.forEach((item) => {
                    circlingCells.push({uid:item.uid, all:item.all})
                  })

                  // Clear neighbours
                  clearNeighbourArray(myNeighbours)
                  updateNeighbours([], false, channel)
                }
              }
              /**
               * Handle AddNeighbour, DeleteNeighbour, and DeleteMember actions
               */
              else
              {
                let fromcellId = addSiblingMsg.fromCellId
                let fromCell = available_members.find(n=>n.uid === fromcellId)

                if (fromCell != undefined)
                {
                  let existCell = myNeighbours.find(n=>n.uid === fromcellId)
                  let newCells:neighbourInterface[] = myNeighbours

                  /**
                   * AddNeighbour: Another cell added this cell as a neighbour
                   */
                  if(addSiblingMsg.action === ActionType.AddNeighbour)
                  {
                    // Add the cell to this cell's neighbour list
                    if(existCell === undefined)
                    {
                      channel.publish(CHANNEL_SETUP,"addneighbour,"+fromCell.uid+","+cellID + "," + Date.now());
                      newCells.push(fromCell)
                      updateNeighbours(newCells, false, channel)
                      setMyNeighbours(newCells)
                    }
                  }
                  /**
                   * DeleteNeighbour: Another cell removed this cell as a neighbour
                   */
                  else if(addSiblingMsg.action === ActionType.DeleteNeighbour)
                  {
                    if(existCell != undefined)
                      {
                        // If switching to ring mode, clear all neighbours
                        if(addSiblingMsg.circlingCellIds.length > 0){
                          newCells = []
                        }

                        channel.publish(CHANNEL_SETUP,"removeneighbour,"+fromcellId+","+cellID);

                        removeItemFromArray(fromcellId, newCells).then(() => {});
                        updateNeighbours(newCells, false, channel)
                        setMyNeighbours(newCells)
                      }
                  }
                  /**
                   * DeleteMember: A cell left the simulation
                   *
                   * Special handling for ring mode:
                   * - If the master leaves, dissolve the ring
                   * - If a regular cell leaves, rebuild the ring
                   */
                  else if(addSiblingMsg.action === ActionType.DeleteMember)
                    {
                      if(cellInfo.inRing)
                      {
                        // If the master cell leaves, stop the ring
                        if(cellInfo.ringMasterCellId === fromCell.uid)
                        {
                          cellInfo.ringMasterCellId = "";
                          cellInfo.inRing = false;
                          cellInfo.isBlocked = false;
                          cellInfo.isMaster = true;

                          // Remove all neighbour connections
                          myNeighbours.forEach((item)=>{
                            channel.publish(CHANNEL_SETUP,"removeneighbour,"+item.uid+","+cellID);
                            channel.publish(CHANNEL_SETUP,"removeneighbour,"+cellID+","+item.uid);
                          })

                          clearNeighbourArray(cellsInRing)
                          clearNeighbourArray(myNeighbours)
                          updateNeighbours([], false, channel)
                        }
                        else
                        {
                          // If a regular cell leaves, rebuild the ring (master only)
                          if(cellInfo.ringMasterCellId === cellID)
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
                        // Not in ring mode: just remove from neighbours
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
          /**
           * Handle FireNotification: Update running info with new CV/RP values
           *
           * This updates the displayed CV/RP values based on whether this cell
           * is blocked (unhealthy) or healthy.
           */
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

    /**
     * handleNext - Advances to the next step in the stepper
     *
     * Special handling for step 1 (Setup):
     * - Publishes neighbour selections to other cells
     * - For Ring mode, publishes ring topology
     */
    const handleNext = () => {
      if(activeStep === 1)
      {
        // Publish neighbour selections
        updateNeighbours(myNeighbours, true, channel)

        // For Ring mode, publish ring topology
        if (selectedMode.mode == SimulationMode.NeighbourRing)
        {
          updateCellsInRing(cellsInRing, channel)
        }
      }
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    /**
     * handleBack - Goes back to the previous step
     */
    const handleBack = () => {
      setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    /**
     * handleReset - Resets the stepper to the first step
     */
    const handleReset = () => {
      setActiveStep(0);
    };

    /**
     * get_step_label - Gets the display label for a step
     *
     * Prepends the mode name to step 2 (Setup) label
     * e.g., "Neighbour Setup", "Location Setup", "Neighbour Ring Setup"
     *
     * @param index - Step index
     * @param label - Base label
     * @returns Display label for the step
     */
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

    /**
     * getConponents - Returns the appropriate component for each step
     *
     * Step 0: Mode selection (ChooseMode)
     * Step 1: Setup based on mode (AddNeighbour, AddNeighbourRing, or LocationMode)
     * Step 2: Fire signal interface (FireSignal)
     *
     * @param index - Step index
     * @returns React component for the step
     */
    const getConponents = (index:number) => {
        // Step 0: Select Simulation Mode
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
        // Step 1: Setup (different component based on mode)
        else if (index === 1){
              if(selectedMode.mode === SimulationMode.Neighbour)
              {
                // Unsubscribe from location mode channel
                channel.unsubscribe("activeCA");
                return (<AddNeighbour currentNeighbours = {myNeighbours} setMyNeighbours={setMyNeighbours}></AddNeighbour>);
              }
              else if(selectedMode.mode === SimulationMode.NeighbourRing)
                {
                  // Unsubscribe from location mode channel
                  channel.unsubscribe("activeCA");
                  return (<AddNeighbourRing currentNeighbours = {myNeighbours} cellsInRing = {cellsInRing} setRingCells={setCellsInRing}></AddNeighbourRing>);
                }
              else
              {
                 // Location mode
                 return (<LocationMode />) ;
              }
        }
        // Step 2: Fire Signal
        else{
            return (
                <FireSignal cellList={cellsInRing} neighbourList={myNeighbours} />
            );
        }

      };

      /**
       * getRenderContent - Renders different UI based on cell role
       *
       * Master Cell (or regular cell not in ring):
       * - Shows full stepper interface with all 3 steps
       * - Shows reentry dialog when in reentrant arrhythmia
       *
       * Non-Master Cell (in ring):
       * - Shows only RunningInfo (current state and neighbours)
       * - Cannot control the simulation, only the master can
       */
      function getRenderContent()
      {
        if(cellInfo.isMaster)
        {
          return(
            <div>
              {/* Reentry Dialog - Shows when reentrant arrhythmia is detected */}
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

            {/* Main Stepper Interface */}
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
                    {/* Render the component for this step */}
                    {getConponents(index)}

                    {/* Navigation buttons */}
                    <Box sx={{ mb: 2 }}>
                      {/* Continue button - disabled if no mode selected or ring has < 5 cells */}
                      <Button
                        disabled={selectedMode.mode === SimulationMode.None || (index === 1 && selectedMode.mode === SimulationMode.NeighbourRing && cellsInRing.length < 5 )}
                        style={
                          // Hide for last step or Location mode setup (no continue needed)
                          { display: index === steps.length - 1 || (index === 1 && selectedMode.mode === SimulationMode.Location) ? 'none' : 'default'}
                        }
                        variant="contained"
                        onClick={handleNext}
                        sx={{ mt: 1, mr: 1 }}
                      >
                        {index === steps.length - 1 ? 'Finish' : 'Continue'}
                      </Button>
                      {/* Back button - disabled on first step */}
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
          // Non-master cell in ring: show only running info
          return(
            <RunningInfo cellList={cellsInRing} neighbourList={myNeighbours} />
          )
        }
      }

    /**
     * Main render - Dialog containing the entire stepper interface
     *
     * Background color changes to gray if this cell is blocked (unhealthy)
     */
    return (

      <Dialog
      open={true}
      PaperProps={{
        component: 'form',
        // Gray background if blocked, normal otherwise
        sx: { backgroundImage: 'none', backgroundColor: cellInfo.isBlocked ? "lightgray" : "none"  },
      }}
    ><div id="overlay">
      {/* Dialog title shows this cell's unique ID */}
      <DialogTitle>Your UID: {cellID}</DialogTitle>
      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: '375px', minHeight:"700px" }}
      >
        {/* Render stepper or running info based on role */}
        {getRenderContent()}

        {/* Completion message (currently unreachable as step 3 has no finish button) */}
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