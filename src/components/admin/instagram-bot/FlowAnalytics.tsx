"use client";

import { useMemo } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ActionNode } from "./nodes/ActionNode";
import { ConditionNode } from "./nodes/ConditionNode";
import { TriggerNode } from "./nodes/TriggerNode";
import { LabeledEdge } from "./edges/LabeledEdge";

const nodeTypes = { trigger: TriggerNode, condition: ConditionNode, action: ActionNode };
const edgeTypes = { labeled: LabeledEdge };

type FlowAnalyticsProps = {
  nodes: Node[];
  edges: Edge[];
  /** node id → visit count */
  counts: Record<string, number>;
};

export function FlowAnalytics({ nodes, edges, counts }: FlowAnalyticsProps) {
  const max = Math.max(1, ...Object.values(counts));

  const styledNodes = useMemo(
    () =>
      nodes.map((n) => {
        const c = counts[n.id] ?? 0;
        const intensity = c / max;
        return {
          ...n,
          data: { ...n.data, _heatCount: c },
          style: {
            ...n.style,
            boxShadow: c > 0 ? `0 0 0 2px rgba(59,130,246,${0.35 + intensity * 0.5})` : undefined,
          },
        };
      }),
    [nodes, counts, max],
  );

  return (
    <div className="h-[min(420px,55vh)] w-full rounded-md border bg-muted/20">
      <ReactFlowProvider>
        <ReactFlow
          nodes={styledNodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{ type: "labeled" }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <MiniMap pannable zoomable />
          <Controls showInteractive={false} />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
