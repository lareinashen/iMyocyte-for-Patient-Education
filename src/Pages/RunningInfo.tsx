/**
 * RunningInfo Component
 *
 * This component displays the current state and configuration of the cell during simulation.
 * It shows different information depending on whether the cell is:
 * - Part of a ring topology
 * - The master/leader cell
 * - A regular cell in neighbour mode
 *
 * Information displayed includes:
 * - List of cells in the ring (if applicable)
 * - List of direct neighbours
 * - Current exercise level (for master cell in ring mode)
 * - Warning if this cell is the "blocker" (unhealthy cell)
 */

import { cellInfo, neighbourInterface } from "../data/GlobalVariables";
import { Alert, Box, TextField } from "@mui/material";
import { useRunningInfo } from "../data/CountContext";

/**
 * MyNeighboursPros - Component props interface
 * @property cellList - Array of all cells in the ring (empty if not in ring mode)
 * @property neighbourList - Array of this cell's direct neighbours
 */
interface MyNeighboursPros{
    cellList : neighbourInterface[]
    neighbourList: neighbourInterface[]
}

/**
 * RunningInfo Component
 * Displays current cell configuration and neighbours
 */
const RunningInfo = ({cellList, neighbourList} : MyNeighboursPros) => {
    // Get current simulation parameters from context
    const { runningInfo } = useRunningInfo();

    /**
     * getRenderContents - Renders the main content based on cell state
     *
     * Shows different UI for:
     * - Cells in a ring: Shows ring members and neighbours with warning
     * - Regular cells: Shows only neighbours
     *
     * @returns JSX element with appropriate content
     */
    function getRenderContents()
    {
        // Build comma-separated list of cell IDs in the ring
        let cellNames:string = ""
        cellList.forEach((item) => {
                cellNames = cellNames + " " + item.uid + ","
        });
        cellNames = cellNames.substring(0, cellNames.length - 1)

        // Build comma-separated list of neighbour IDs
        let neighbourNames:string = ""
        neighbourList.forEach((item) => {
            neighbourNames = neighbourNames + " " + item.uid + ","
        })
        neighbourNames = neighbourNames.substring(0, neighbourNames.length - 1)

        // If this cell is part of a ring, show ring-specific UI
        if (cellInfo.inRing)
        {
            return(
            <Box>
                {/* Alert with different severity based on whether this is the blocker cell */}
                <Alert severity={cellInfo.isBlocked ?"warning":"info"} style={{ maxWidth: 300 }}>
                    You are{cellInfo.isBlocked ? " the blocker cell ":" "}in a ring! Please stay until the session is finished.
                </Alert>
                <div className='pt-2'></div>

                {/* Display all cells in the ring */}
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

                {/* Display this cell's direct neighbours in the ring */}
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
            // For regular neighbour mode, just show neighbours
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

    /**
     * getCellInfoContents - Renders additional info for master cell in ring mode
     *
     * Only the master cell in ring mode sees the current exercise level
     * (Rest, Walking, Jogging, or Sprinting)
     *
     * @returns JSX element with exercise level or null
     */
    function getCellInfoContents()
    {
        // Only show for master cell in ring mode
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