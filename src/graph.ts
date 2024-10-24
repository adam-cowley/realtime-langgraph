import { MemorySaver, Annotation, END, START, StateGraph, BaseCheckpointSaver, Checkpoint, CheckpointMetadata, CheckpointTuple } from "@langchain/langgraph";
import { ProcessStage } from "./message";
import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import { CheckpointListOptions, ChannelVersions, PendingWrite } from "@langchain/langgraph-checkpoint";
import { io } from "./socket";
import { Request, Response } from "express";

const sleep = () => {
  return new Promise((resolve) => {
    setTimeout(resolve, 1000)
  })
}

const StateAnnotation = Annotation.Root({
  input: Annotation<string>(),
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
  stage: Annotation<ProcessStage>(),
})

export type State = typeof StateAnnotation.State

const NODE_INFERING = 'infering'
async function infering() {
  await sleep()
  return {
    messages: [new AIMessage('I am Infering...')],
    stage: ProcessStage.INFERING,
  }
}

const NODE_THINKING = 'thinking'
async function thinking() {
  await sleep()
  return {
    messages: [new AIMessage('I am Thinking...')],
    stage: ProcessStage.THINKING,
  }
}

const NODE_SEARCHING = 'searching'
async function searching() {
  await sleep()
  return {
    messages: [new AIMessage('I am Searching...')],
    stage: ProcessStage.SEARCHING,
  }
}


const NODE_REASONING = 'reasoning'
async function reasoning() {
  await sleep()
  return {
    messages: [new AIMessage('I am Reasoning...')],
    stage: ProcessStage.REASONING,
  }
}


const NODE_ANSWERING = 'answering'
async function answering() {
  await sleep()
  return {
    messages: [new AIMessage('The answer is 42.')],
    stage: ProcessStage.ANSWERING,
  }
}




const workflow = new StateGraph(StateAnnotation)
  .addNode(NODE_INFERING, infering)
  .addNode(NODE_THINKING, thinking)
  .addNode(NODE_SEARCHING, searching)
  .addNode(NODE_REASONING, reasoning)
  .addNode(NODE_ANSWERING, answering)

  .addEdge(START, NODE_INFERING)
  .addEdge(NODE_INFERING, NODE_THINKING)
  .addEdge(NODE_THINKING, NODE_SEARCHING)
  .addEdge(NODE_SEARCHING, NODE_REASONING)
  .addEdge(NODE_REASONING, NODE_ANSWERING)
  .addEdge(NODE_ANSWERING, END)

  class SSECheckpointer extends MemorySaver {
    async put(config: RunnableConfig, checkpoint: Checkpoint, metadata: CheckpointMetadata): Promise<RunnableConfig> {
      if (metadata.writes) {
        const res: Response | undefined = config.configurable?.res

        const keys: string[] = Object.keys(metadata.writes)
        const state = metadata.writes[keys[0]] as typeof StateAnnotation.State

        if (state) {
          let message

          if (state.messages?.length > 0) {
            message = state.messages[state.messages.length - 1].content
          }

          const stage = state.stage

          if (res) {
            res.write(JSON.stringify({message, stage}))
          }
        }
      }

      return super.put(config, checkpoint, metadata)
    }
  }

class SocketsCheckpointer extends MemorySaver {
  async put(config: RunnableConfig, checkpoint: Checkpoint, metadata: CheckpointMetadata): Promise<RunnableConfig> {
    if (metadata.writes) {
      const keys: string[] = Object.keys(metadata.writes)
      const state = metadata.writes[keys[0]]

      if (state) {
        let message

        // @ts-ignore
        if (state.messages?.length > 0) {
          // @ts-ignore
          message = state.messages[state.messages.length - 1].content
        }

        // @ts-ignore
        const stage = state.stage

        io.to(config.configurable?.thread_id).emit("UPDATE", {
          message,
          stage,
        })
      }
    }

    return super.put(config, checkpoint, metadata)
  }
}

export const langgraph = workflow.compile({
  checkpointer: new SSECheckpointer(),
})
