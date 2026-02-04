import { cellInfo, neighbourInterface } from "../data/GlobalVariables";
import { Alert, Box, TextField } from "@mui/material";
import { useRunningInfo } from "../data/CountContext";

interface MyNeighboursPros{
    cellList : neighbourInterface[]
    neighbourList: neighbourInterface[]
}

const RunningInfo = ({cellList, neighbourList} : MyNeighboursPros) => {
    const { runningInfo } = useRunningInfo();

    function getRenderContents()
    {
        let cellNames:string = ""
        cellList.forEach((item) => {
                cellNames = cellNames + " " + item.uid + ","
        });
        cellNames = cellNames.substring(0, cellNames.length - 1)

        let neighbourNames:string = ""
        neighbourList.forEach((item) => {
            neighbourNames = neighbourNames + " " + item.uid + ","
        })
        neighbourNames = neighbourNames.substring(0, neighbourNames.length - 1)
        
        if (cellInfo.inRing)
        {
            return(
            <Box>
                <Alert severity={cellInfo.isBlocked ?"warning":"info"} style={{ maxWidth: 300 }}>You are{cellInfo.isBlocked ? " the blocker cell ":" "}in a ring! Please stay until the session is finished.</Alert>
                <div className='pt-2'></div>
                <TextField
                    fullWidth 
                    id="outlined-multiline-static"
                    label="Cells In Ring"
                    multiline
                    rows={2}
                    value={cellNames}
                    slotProps={{
                        input: {
                        readOnly: true,
                        },
                    }}
                />
                <div className='pt-2'></div>
                <TextField
                    fullWidth 
                    id="outlined-multiline-static"
                    label="My Neighbours"
                    multiline
                    rows={1}
                    value={neighbourNames}
                    slotProps={{
                        input: {
                        readOnly: true,
                        },
                    }}
                />
            </Box>
            );
        }
        else{
            return(
                <Box>
                    <TextField
                        fullWidth 
                        id="outlined-multiline-static"
                        label="My neighbours"
                        multiline
                        rows={1}
                        value={neighbourNames}
                        slotProps={{
                            input: {
                            readOnly: true,
                            },
                        }}
                    />        
                    
                    </Box>
                );
        }
    }
    
    function getCellInfoContents()
    {
        if (cellInfo.inRing && cellInfo.isMaster && runningInfo) {
            return (
                <Box sx={{ mt: 2 }}>
                    <TextField
                        fullWidth
                        id="activity-level"
                        label="Exercise Level"
                        value={runningInfo.levelName || "Not set"}
                        slotProps={{
                            input: {
                                readOnly: true,
                            },
                        }}
                    />
                </Box>
            );
        }
        return null;
    }
    return (
        <div>
            <div>
                {getRenderContents()}
            </div>
            <div>
                {getCellInfoContents()}
            </div>
        </div>
    );
}

export default RunningInfo