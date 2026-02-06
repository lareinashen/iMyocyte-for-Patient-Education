/**
 * LocationMode Component
 *
 * This component implements location-based signal propagation where cells are
 * positioned based on their physical location in a room. Users drag a dot to
 * indicate their position, and signals propagate based on spatial proximity.
 *
 * Features:
 * - Draggable dot to set cell position
 * - Visual feedback (blue when in valid area, red when outside)
 * - Grid-based cell indexing system
 * - Real-time signal propagation based on location
 *
 * This is Step 2 in the simulation setup for Location Mode.
 */

import React, { useRef, useEffect } from "react";
import { Alert } from "@mui/material";
import { flashBody } from "../Services/SharedFunctions";
import { useChannel } from "ably/react";
import { CHANNEL_NAME } from "../data/Constants";

const LocationMode = () => {
      // Subscribe to Ably channel for real-time communication
      const { channel } = useChannel({ channelName: CHANNEL_NAME }, () => {
      })

      // Reference to the draggable location dot element
      const locationDotRef = useRef<HTMLDivElement | null>(null);

      // Drag state variables
      var active = false;      // Whether currently dragging
      var currentX = 0;        // Current X position during drag
      var currentY = 0;        // Current Y position during drag
      var initialX = 0;        // Initial X position when drag started
      var initialY = 0;        // Initial Y position when drag started
      var xOffset = 0;         // Total X offset from origin
      var yOffset = 0;         // Total Y offset from origin

      // Room identifier (currently unused, set to -1)
      var room = -1

      /**
       * handleClick - Fires a signal from this cell's location
       *
       * Calculates the cell index based on current position and publishes
       * a trigger event to notify other cells in the vicinity.
       */
      const handleClick  = () => {
        // Convert pixel position to grid coordinates (0-50 range)
        var ci=findCellIndex(room,Math.round(xOffset/234.0*50),Math.round(yOffset/234.0*50));
        channel.publish("triggerCA",""+ci);
      }

      /**
       * findCellIndex - Converts room and x,y coordinates to a unique cell index
       *
       * Uses a grid-based indexing system where the room is divided into cells.
       * Different rooms have different offset configurations.
       *
       * @param room - Room identifier (0-15 for predefined rooms, -1 for default)
       * @param x - X coordinate in the grid (0-50)
       * @param y - Y coordinate in the grid (0-50)
       * @returns Unique cell index number
       */
      function findCellIndex(room:number,x:number,y:number){
        // Predefined room offset configurations
        var offsets=[[0,0],[25,0],[50,0],[75,0],[0,25],[25,25],[50,25],[75,25],[0,50],[25,50],[50,50],[75,50],[0,75],[15,75],[50,75],[75,75]];

        if ((room>=0)&&(room<offsets.length)){
          // Use room-specific offset
          return (offsets[room][1]+y)*100+offsets[room][0]+x;
          }
        else{
          // Default calculation for undefined rooms
          return (y*2)*100+(x*2);
        }
       }

      /**
       * processTrigger - Handles incoming trigger events from other cells
       *
       * Checks if this cell's location matches any of the active cells
       * in the trigger event. If so, flashes the body to indicate signal arrival.
       *
       * @param data - Comma-separated list of active cell indices
       */
      function processTrigger(data:string){
         var ci=findCellIndex(room,Math.round(xOffset/234.0*50),Math.round(yOffset/234.0*50));
         var lastactive=data.split(",");
         for (var i=0;i<lastactive.length;i++){
             if (ci==parseInt(lastactive[i])){
                 // This cell is in the active zone, flash the body
                 flashBody(false);
             }
          }
      }

      /**
       * Subscribe to "activeCA" channel to receive trigger events
       *
       * Uses useEffect to ensure subscription happens once and cleanup occurs
       * on component unmount. This prevents duplicate subscriptions.
       */
      useEffect(() => {
        const messageHandler = function(message: any) {
          processTrigger(message.data);
        };

        channel.subscribe("activeCA", messageHandler);

        // Cleanup function to unsubscribe when component unmounts
        return () => {
          channel.unsubscribe("activeCA", messageHandler);
        };
      }, [channel]); // Only re-subscribe if channel instance changes

      /**
       * mouseUpEventHandler - Handles mouse button release
       *
       * Finalizes the drag operation by updating initial position
       * and deactivating drag mode.
       */
      function mouseUpEventHandler() {
          initialX = currentX;
          initialY = currentY;
          active = false;
      }

      /**
       * mouseDownEventHandler - Handles mouse button press
       *
       * Initiates drag operation by recording the starting position
       * and activating drag mode.
       *
       * @param e - Mouse event
       */
      function mouseDownEventHandler(e: React.MouseEvent<HTMLDivElement>) {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
        active = true;
    }

      /**
       * TouchStartEventHandler - Handles touch start (mobile)
       *
       * Initiates drag operation for touch devices.
       *
       * @param e - Touch event
       */
      function TouchStartEventHandler(e: React.TouchEvent<HTMLDivElement>) {
        initialX = e.touches[0].clientX - xOffset;
        initialY = e.touches[0].clientY - yOffset;
        active = true;
      }

      /**
       * touchMoveEventHandler - Handles touch move (mobile)
       *
       * Updates dot position as user drags on touch device.
       *
       * @param e - Touch event
       */
      function touchMoveEventHandler(e: React.TouchEvent<HTMLDivElement>) {
        if (active) {
          e.preventDefault();
          currentX = e.touches[0].clientX - initialX;
          currentY = e.touches[0].clientY - initialY;

          xOffset = currentX;
          yOffset = currentY;

          setTranslate(currentX, currentY);
        }
      }

      /**
       * mouseMoveEventHandler - Handles mouse movement
       *
       * Updates dot position as user drags with mouse.
       *
       * @param e - Mouse event
       */
      function mouseMoveEventHandler(e: React.MouseEvent<HTMLDivElement>) {
        if (active) {
          e.preventDefault();

          currentX = e.clientX - initialX;
          currentY = e.clientY - initialY;

          xOffset = currentX;
          yOffset = currentY;

          setTranslate(currentX, currentY);
        }
      }

      /**
       * setTranslate - Updates the visual position of the location dot
       *
       * Applies CSS transform to move the dot and changes color based on
       * whether the position is within the valid area.
       *
       * Color coding:
       * - Blue: Position is within valid area (0-235px in both dimensions)
       * - Red: Position is outside valid area
       *
       * @param xPos - X position in pixels
       * @param yPos - Y position in pixels
       */
      function setTranslate(xPos:number, yPos:number) {
        if(locationDotRef.current != null)
        {
          // Apply 3D transform for smooth animation
          locationDotRef.current.style.transform = "translate3d(" + xPos + "px, " + yPos + "px, 0)";

          // Change color based on whether position is in valid area
          if ((xOffset>=0)&&(xOffset<235)&&(yOffset>=0)&&(yOffset<235)){
            locationDotRef.current.style.backgroundColor="blue";  // Valid position
          }
          else{
            locationDotRef.current.style.backgroundColor="red";   // Invalid position
          }
        }
    }
  return (
    <div>
      {/* Instructions for the user */}
      <div className="collapsible-body" >
      <div className="row">
        <Alert severity="warning">Drag the dot to your relative location in the room...</Alert>
      </div>
	   </div>

     <div className="row">
        <div className="col s12">
        <h5>your room's front</h5>

        {/* Draggable location box with touch and mouse event handlers */}
        <div id="locationbox"
          onTouchStart={(e) => TouchStartEventHandler(e)}
          onTouchMove={(e) => touchMoveEventHandler(e)}
          onTouchEnd={() => mouseUpEventHandler()}
          onMouseDown={(e) => mouseDownEventHandler(e)}
          onMouseUp ={() => mouseUpEventHandler()}
          onMouseMove={(e) => mouseMoveEventHandler(e)}>

          <div id = "locationinnerbox" >
            {/* The draggable dot representing cell location */}
	          <div id="locationdot" ref={locationDotRef} >
	          </div>
	        </div>
	      </div>
      </div>
      </div>

      <h5>your room's back</h5>

      {/* Fire button to trigger signal from this location */}
      <div className="col s2 offset-s5">
        <a onClick={handleClick} className="btn-floating btn-large pulse red lighten-2" id='fire_button_1s'>
          <i className="material-icons left">sunny</i>fire
        </a>
      </div>
    </div>
  );
}

export default LocationMode