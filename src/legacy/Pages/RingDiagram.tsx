/**
 * RingDiagram Component
 *
 * This component visualizes the ring topology and real-time signal propagation
 * in Neighbour Ring Mode. It displays:
 *
 * - Circular arrangement of cells in the ring
 * - Visual indication of cell states (resting, excited, refractory)
 * - Cell roles (Leader, Unhealthy, Healthy)
 * - Real-time animation of signal propagation
 *
 * Cell States:
 * - Green: Resting (ready to fire)
 * - Red: Excited (currently firing)
 * - Gray: Refractory (cannot fire, recovering)
 *
 * Cell Labels:
 * - L: Leader (master cell that controls the ring)
 * - U: Unhealthy (blocked cell with slower conduction)
 * - ●: Healthy (normal cell)
 */

import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { neighbourInterface, cellID, cellInfo } from '../data/GlobalVariables';
import { useChannel } from 'ably/react';
import { CHANNEL_NAME } from '../data/Constants';

/**
 * RingDiagramProps - Component props interface
 * @property cellList - Array of cells in the ring
 * @property blockedCellId - ID of the unhealthy/blocked cell (empty string if none)
 */
interface RingDiagramProps {
    cellList: neighbourInterface[];
    blockedCellId: string;
}

/**
 * CellState - Tracks the visual state of each cell
 * @property uid - Unique identifier of the cell
 * @property isFlashing - Whether the cell is currently flashing (excited)
 * @property isInRP - Whether the cell is in refractory period
 */
interface CellState {
    uid: string;
    isFlashing: boolean;
    isInRP: boolean;
}

/**
 * RingDiagram Component
 * Renders an interactive visualization of the ring topology
 */
const RingDiagram: React.FC<RingDiagramProps> = ({ cellList, blockedCellId }) => {
    // Map of cell IDs to their current visual states
    const [cellStates, setCellStates] = useState<Map<string, CellState>>(new Map());

    // Subscribe to the Ably channel for real-time updates
    const { channel } = useChannel({ channelName: CHANNEL_NAME }, () => {});

    /**
     * Initialize cell states when cellList changes
     * Sets all cells to resting state (not flashing, not in RP)
     */
    useEffect(() => {
        const initialStates = new Map<string, CellState>();
        cellList.forEach(cell => {
            initialStates.set(cell.uid, {
                uid: cell.uid,
                isFlashing: false,  // Not currently excited
                isInRP: false       // Not in refractory period
            });
        });
        setCellStates(initialStates);
    }, [cellList]);

    /**
     * Subscribe to "events" channel to track signal arrivals and update visualization
     *
     * Event format: "fire,<cellId>,<timestamp>,<rpDuration>"
     *
     * When a cell fires:
     * 1. Flash red for 500ms (excited state)
     * 2. Turn gray for the refractory period duration
     * 3. Return to green (resting state)
     */
    useEffect(() => {
        const handleEvent = (message: any) => {
            const data = message.data as string;
            const parts = data.split(',');

            // Check if this is a "fire" event with valid data
            if (parts[0] === 'fire' && parts.length >= 3) {
                const firedCellId = parts[1];
                // Get actual RP duration from message, default to 2000ms if not provided
                const rpDuration = parts.length >= 4 ? parseInt(parts[3]) : 2000;

                // Step 1: Set cell to flashing (excited) and in refractory period
                setCellStates(prev => {
                    const newStates = new Map(prev);
                    const cellState = newStates.get(firedCellId);
                    if (cellState) {
                        newStates.set(firedCellId, { ...cellState, isFlashing: true, isInRP: true });
                    }
                    return newStates;
                });

                // Step 2: Stop flashing after 500ms (end of excited state)
                // Cell remains gray (in RP) but no longer flashing red
                setTimeout(() => {
                    setCellStates(prev => {
                        const newStates = new Map(prev);
                        const cellState = newStates.get(firedCellId);
                        if (cellState) {
                            newStates.set(firedCellId, { ...cellState, isFlashing: false });
                        }
                        return newStates;
                    });
                }, 500);

                // Step 3: Exit refractory period after actual RP duration
                // Cell returns to green (resting state)
                setTimeout(() => {
                    setCellStates(prev => {
                        const newStates = new Map(prev);
                        const cellState = newStates.get(firedCellId);
                        if (cellState) {
                            newStates.set(firedCellId, { ...cellState, isInRP: false });
                        }
                        return newStates;
                    });
                }, rpDuration); // Use actual RP duration from the event message
            }
        };

        // Subscribe to events channel
        channel.subscribe('events', handleEvent);

        // Cleanup: unsubscribe when component unmounts
        return () => {
            channel.unsubscribe('events', handleEvent);
        };
    }, [channel]);

    /**
     * getCellPosition - Calculate x,y coordinates for a cell in the ring
     *
     * Arranges cells in a circle with the first cell at the top (12 o'clock position)
     * and subsequent cells arranged clockwise.
     *
     * @param index - Index of the cell in the cellList array
     * @param total - Total number of cells in the ring
     * @returns Object with x and y coordinates
     */
    const getCellPosition = (index: number, total: number) => {
        // Calculate angle for this cell (start from top, go clockwise)
        const angle = (index * 2 * Math.PI) / total - Math.PI / 2;
        const radius = 120;      // Distance from center
        const centerX = 150;     // Center X coordinate
        const centerY = 150;     // Center Y coordinate

        return {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle)
        };
    };

    /**
     * getCellColor - Determine the color of a cell based on its state
     *
     * Color scheme:
     * - Red (#ff6b6b): Cell is excited (currently firing)
     * - Gray (#868e96): Cell is in refractory period (recovering)
     * - Green (#51cf66): Cell is resting (ready to fire)
     *
     * @param cell - The cell (unused but kept for potential future use)
     * @param state - Current state of the cell
     * @returns Hex color code
     */
    const getCellColor = (cell: neighbourInterface, state?: CellState) => {
        if (state?.isFlashing) return '#ff6b6b'; // Red flash (excited)
        if (state?.isInRP) return '#868e96'; // Gray during RP (refractory)
        return '#51cf66'; // Green (resting/ready)
    };

    /**
     * getCellLabel - Get the label to display inside a cell
     *
     * Labels:
     * - 'L': Leader/Master cell (controls the ring)
     * - 'U': Unhealthy/Blocked cell (slower conduction)
     * - '●': Healthy cell (normal)
     *
     * @param cell - The cell to get label for
     * @returns Single character or symbol to display
     */
    const getCellLabel = (cell: neighbourInterface) => {
        if (cell.uid === cellID) return 'L'; // Leader (Master)
        if (cell.uid === blockedCellId) return 'U'; // Unhealthy
        return '●'; // Healthy
    };

    /**
     * getUpstreamDownstream - Get the neighbouring cells in the ring
     *
     * In a ring topology, each cell has exactly two neighbours:
     * - Upstream: Previous cell in the ring (receives signals from)
     * - Downstream: Next cell in the ring (sends signals to)
     *
     * @param index - Index of the cell in the cellList array
     * @returns Object with upstream and downstream cells
     *
     * Note: Currently unused but kept for potential future features
     */
    const getUpstreamDownstream = (index: number) => {
        const total = cellList.length;
        const upstreamIndex = (index - 1 + total) % total;
        const downstreamIndex = (index + 1) % total;

        return {
            upstream: cellList[upstreamIndex],
            downstream: cellList[downstreamIndex]
        };
    };

    return (
        <Paper elevation={3} sx={{ p: 2, mb: 2, backgroundColor: '#f8f9fa' }}>
            <Typography variant="h6" gutterBottom align="center">
                Ring Topology ({cellList.length} cells)
            </Typography>
            
            <Box sx={{ position: 'relative', width: 300, height: 300, margin: '0 auto' }}>
                <svg width="300" height="300">
                    {/* Draw connections */}
                    {cellList.map((cell, index) => {
                        const pos1 = getCellPosition(index, cellList.length);
                        const pos2 = getCellPosition((index + 1) % cellList.length, cellList.length);
                        
                        return (
                            <line
                                key={`line-${index}`}
                                x1={pos1.x}
                                y1={pos1.y}
                                x2={pos2.x}
                                y2={pos2.y}
                                stroke="#dee2e6"
                                strokeWidth="2"
                            />
                        );
                    })}
                    
                    {/* Draw cells */}
                    {cellList.map((cell, index) => {
                        const pos = getCellPosition(index, cellList.length);
                        const state = cellStates.get(cell.uid);
                        const color = getCellColor(cell, state);
                        const label = getCellLabel(cell);
                        
                        return (
                            <g key={`cell-${cell.uid}`}>
                                <circle
                                    cx={pos.x}
                                    cy={pos.y}
                                    r="20"
                                    fill={color}
                                    stroke="#343a40"
                                    strokeWidth="2"
                                />
                                <text
                                    x={pos.x}
                                    y={pos.y + 5}
                                    textAnchor="middle"
                                    fill="#fff"
                                    fontSize="16"
                                    fontWeight="bold"
                                >
                                    {label}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </Box>

            {/* Legend */}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption">L = Leader</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption">U = Unhealthy</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: '#51cf66', border: '2px solid #343a40' }} />
                    <Typography variant="caption">Resting</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: '#ff6b6b', border: '2px solid #343a40' }} />
                    <Typography variant="caption">Excited</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: '#868e96', border: '2px solid #343a40' }} />
                    <Typography variant="caption">Refractory</Typography>
                </Box>
            </Box>
        </Paper>
    );
};

export default RingDiagram;

