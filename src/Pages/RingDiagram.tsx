import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { neighbourInterface, cellID, cellInfo } from '../data/GlobalVariables';
import { useChannel } from 'ably/react';
import { CHANNEL_NAME } from '../data/Constants';

interface RingDiagramProps {
    cellList: neighbourInterface[];
    blockedCellId: string;
}

interface CellState {
    uid: string;
    isFlashing: boolean;
    isInRP: boolean;
}

const RingDiagram: React.FC<RingDiagramProps> = ({ cellList, blockedCellId }) => {
    const [cellStates, setCellStates] = useState<Map<string, CellState>>(new Map());
    const { channel } = useChannel({ channelName: CHANNEL_NAME }, () => {});

    // Initialize cell states
    useEffect(() => {
        const initialStates = new Map<string, CellState>();
        cellList.forEach(cell => {
            initialStates.set(cell.uid, {
                uid: cell.uid,
                isFlashing: false,
                isInRP: false
            });
        });
        setCellStates(initialStates);
    }, [cellList]);

    // Subscribe to "events" channel to track signal arrivals
    useEffect(() => {
        const handleEvent = (message: any) => {
            const data = message.data as string;
            const parts = data.split(',');

            if (parts[0] === 'fire' && parts.length >= 3) {
                const firedCellId = parts[1];
                const rpDuration = parts.length >= 4 ? parseInt(parts[3]) : 2000; // Get actual RP duration from message, default to 2000ms if not provided

                // Flash the cell
                setCellStates(prev => {
                    const newStates = new Map(prev);
                    const cellState = newStates.get(firedCellId);
                    if (cellState) {
                        newStates.set(firedCellId, { ...cellState, isFlashing: true, isInRP: true });
                    }
                    return newStates;
                });

                // Stop flashing after 500ms
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

                // Exit RP after actual RP duration from the message
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

        channel.subscribe('events', handleEvent);

        return () => {
            channel.unsubscribe('events', handleEvent);
        };
    }, [channel]);

    // Calculate positions for cells in a ring
    const getCellPosition = (index: number, total: number) => {
        const angle = (index * 2 * Math.PI) / total - Math.PI / 2; // Start from top
        const radius = 120;
        const centerX = 150;
        const centerY = 150;
        
        return {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle)
        };
    };

    // Get cell color based on state
    const getCellColor = (cell: neighbourInterface, state?: CellState) => {
        if (state?.isFlashing) return '#ff6b6b'; // Red flash
        if (state?.isInRP) return '#868e96'; // Gray during RP
        return '#51cf66'; // Green for all cells (leader, unhealthy, healthy)
    };

    // Get cell label
    const getCellLabel = (cell: neighbourInterface) => {
        if (cell.uid === cellID) return 'L'; // Leader (Master)
        if (cell.uid === blockedCellId) return 'U'; // Unhealthy
        return '●'; // Healthy
    };

    // Get upstream and downstream cells
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

