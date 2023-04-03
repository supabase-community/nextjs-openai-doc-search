"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { CreateChatCompletionResponse } from "openai";
import { SSE } from "sse.js";
import { getEdgeFunctionUrl } from "@/lib/utils";

function promptDataReducer(
  state: any[],
  action: {
    index?: number;
    answer?: string | undefined;
    status?: string;
    query?: string | undefined;
    type?: "remove-last-item" | string;
  }
) {
  // set a standard state to use later
  let current = [...state];

  if (action.type) {
    switch (action.type) {
      case "remove-last-item":
        current.pop();
        return [...current];
      default:
        break;
    }
  }

  // check that an index is present
  if (action.index === undefined) return [...state];

  if (!current[action.index]) {
    current[action.index] = { query: "", answer: "", status: "" };
  }

  current[action.index].answer = action.answer;

  if (action.query) {
    current[action.index].query = action.query;
  }
  if (action.status) {
    current[action.index].status = action.status;
  }

  return [...current];
}

export function SearchDialog() {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState<string>("");
  const [question, setQuestion] = React.useState<string>("");
  const [answer, setAnswer] = React.useState<string | undefined>("");
  const edgeFunctionUrl = getEdgeFunctionUrl();
  const eventSourceRef = React.useRef<SSE>();
  const [isResponding, setIsResponding] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasClippyError, setHasClippyError] = React.useState(false);
  const [promptIndex, setPromptIndex] = React.useState(0);
  const [promptData, dispatchPromptData] = React.useReducer(
    promptDataReducer,
    []
  );

  const cantHelp =
    answer?.trim() === "Sorry, I don't know how to help with that.";
  const status = isLoading
    ? "Clippy is searching..."
    : isResponding
    ? "Clippy is responding..."
    : cantHelp || hasClippyError
    ? "Clippy has failed you"
    : undefined;

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && e.metaKey) {
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleConfirm = React.useCallback(
    async (query: string) => {
      setAnswer(undefined);
      setQuestion(query);
      setSearch("");
      dispatchPromptData({ index: promptIndex, answer: undefined, query });
      setIsResponding(false);
      setHasClippyError(false);
      setIsLoading(true);

      const eventSource = new SSE(`${edgeFunctionUrl}/clippy-search`, {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
        payload: JSON.stringify({ query }),
      });

      function handleError<T>(err: T) {
        setIsLoading(false);
        setIsResponding(false);
        setHasClippyError(true);
        console.error(err);
      }

      eventSource.addEventListener("error", handleError);
      eventSource.addEventListener("message", (e: any) => {
        try {
          setIsLoading(false);

          if (e.data === "[DONE]") {
            setIsResponding(false);
            setPromptIndex((x) => {
              return x + 1;
            });
            return;
          }

          setIsResponding(true);

          const completionResponse: CreateChatCompletionResponse = JSON.parse(
            e.data
          );
          // TODO: figure out why type is incorrect!
          const text = completionResponse.choices[0].text;

          setAnswer((answer) => {
            const currentAnswer = answer ?? "";

            dispatchPromptData({
              index: promptIndex,
              answer: currentAnswer + text,
            });

            return (answer ?? "") + text;
          });
        } catch (err) {
          handleError(err);
        }
      });

      eventSource.stream();

      eventSourceRef.current = eventSource;

      setIsLoading(true);
    },
    [promptIndex, promptData]
  );

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    console.log(search);

    handleConfirm(search);
  };

  return (
    <>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Press{" "}
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-slate-100 bg-slate-100 px-1.5 font-mono text-[10px] font-medium text-slate-600 opacity-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          <span className="text-xs">⌘</span>K
        </kbd>
      </p>
      <Dialog open={open}>
        <DialogContent className="sm:max-w-[850px] text-black">
          <DialogHeader>
            <DialogTitle>OpenAI powered doc search</DialogTitle>
            <DialogDescription>
              Build your own ChatGPT style search with Next.js, OpenAI &
              Supabase.
            </DialogDescription>
            <hr />
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {question && <p>Question: {question}</p>}

              {status && <p>{status}</p>}

              {answer ?? <p>Answer: {answer}</p>}

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="search" className="text-right">
                  Question
                </Label>
                <Input
                  name="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Ask</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
