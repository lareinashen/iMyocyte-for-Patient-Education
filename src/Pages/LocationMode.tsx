import React, { useRef, useEffect } from "react";
import { Alert } from "@mui/material";
import { flashBody } from "../Services/SharedFunctions";
import { useChannel } from "ably/react";
import { CHANNEL_NAME } from "../data/Constants";

const LocationMode = () => {
      const { channel } = useChannel({ channelName: CHANNEL_NAME }, () => {
      })

      const locationDotRef = useRef<HTMLDivElement | null>(null);

      var active = false;
      var currentX = 0;
      var currentY = 0;
      var initialX = 0;
      var initialY = 0;
      var xOffset = 0;
      var yOffset = 0;

      var room = -1

      const handleClick  = () => {
        var ci=findCellIndex(room,Math.round(xOffset/234.0*50),Math.round(yOffset/234.0*50));
        channel.publish("triggerCA",""+ci);
      }

      function findCellIndex(room:number,x:number,y:number){
        var offsets=[[0,0],[25,0],[50,0],[75,0],[0,25],[25,25],[50,25],[75,25],[0,50],[25,50],[50,50],[75,50],[0,75],[15,75],[50,75],[75,75]];
        if ((room>=0)&&(room<offsets.length)){
          return (offsets[room][1]+y)*100+offsets[room][0]+x;
          }
        else{
          return (y*2)*100+(x*2);
        }
       }

      function processTrigger(data:string){
         var ci=findCellIndex(room,Math.round(xOffset/234.0*50),Math.round(yOffset/234.0*50));
         var lastactive=data.split(",");
         for (var i=0;i<lastactive.length;i++){
             if (ci==parseInt(lastactive[i])){
                 flashBody(false);
             }
          }
      }

      // Fix: Use useEffect to subscribe once and cleanup on unmount
      // This prevents duplicate subscriptions on re-renders and StrictMode double-mounting
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

      function mouseUpEventHandler() {
          initialX = currentX;
          initialY = currentY;

          active = false;
      }

      function mouseDownEventHandler(e: React.MouseEvent<HTMLDivElement>) {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;

        active = true;
    }

      function TouchStartEventHandler(e: React.TouchEvent<HTMLDivElement>) {
        initialX = e.touches[0].clientX - xOffset;
        initialY = e.touches[0].clientY - yOffset;

        active = true;
      }

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

      function setTranslate(xPos:number, yPos:number) {
        if(locationDotRef.current != null)
        {
          locationDotRef.current.style.transform = "translate3d(" + xPos + "px, " + yPos + "px, 0)";

          if ((xOffset>=0)&&(xOffset<235)&&(yOffset>=0)&&(yOffset<235)){
            locationDotRef.current.style.backgroundColor="blue";
          }
          else{
            locationDotRef.current.style.backgroundColor="red"; 
          }
        }
    }
  return (
    <div>
      <div className="collapsible-body" >
      <div className="row">
        <Alert severity="warning">Drag the dot to your relative location in the room...</Alert>
      </div>
	   </div>
     <div className="row">
        <div className="col s12">
        <h5>your room's front</h5>
        <div id="locationbox" onTouchStart={(e) => TouchStartEventHandler(e)} onTouchMove={(e) => touchMoveEventHandler(e)} onTouchEnd={() => mouseUpEventHandler()}
          onMouseDown={(e) => mouseDownEventHandler(e)} onMouseUp ={() => mouseUpEventHandler()} onMouseMove={(e) => mouseMoveEventHandler(e)}>
          <div id = "locationinnerbox" >
	          <div id="locationdot" ref={locationDotRef} >
	          </div>
	        </div>
	      </div>
      </div>
      </div>
      <h5>your room's back</h5>
      <div className="col s2 offset-s5"><a  onClick={handleClick} className="btn-floating btn-large pulse red lighten-2" id='fire_button_1s'><i className="material-icons left">sunny</i>fire</a></div>
    </div>
  );
}

export default LocationMode