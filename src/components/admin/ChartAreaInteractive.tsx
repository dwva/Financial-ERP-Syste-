"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const description = "An interactive area chart"

// We'll replace this sample data with actual expense/revenue data in the implementation
const chartData = [
  { date: "2024-04-01", expenses: 222, revenues: 150 },
  { date: "2024-04-02", expenses: 97, revenues: 180 },
  { date: "2024-04-03", expenses: 167, revenues: 120 },
  { date: "2024-04-04", expenses: 242, revenues: 260 },
  { date: "2024-04-05", expenses: 373, revenues: 290 },
  { date: "2024-04-06", expenses: 301, revenues: 340 },
  { date: "2024-04-07", expenses: 245, revenues: 180 },
  { date: "2024-04-08", expenses: 409, revenues: 320 },
  { date: "2024-04-09", expenses: 59, revenues: 110 },
  { date: "2024-04-10", expenses: 261, revenues: 190 },
  { date: "2024-04-11", expenses: 327, revenues: 350 },
  { date: "2024-04-12", expenses: 292, revenues: 210 },
  { date: "2024-04-13", expenses: 342, revenues: 380 },
  { date: "2024-04-14", expenses: 137, revenues: 220 },
  { date: "2024-04-15", expenses: 120, revenues: 170 },
  { date: "2024-04-16", expenses: 138, revenues: 190 },
  { date: "2024-04-17", expenses: 446, revenues: 360 },
  { date: "2024-04-18", expenses: 364, revenues: 410 },
  { date: "2024-04-19", expenses: 243, revenues: 180 },
  { date: "2024-04-20", expenses: 89, revenues: 150 },
  { date: "2024-04-21", expenses: 137, revenues: 200 },
  { date: "2024-04-22", expenses: 224, revenues: 170 },
  { date: "2024-04-23", expenses: 138, revenues: 230 },
  { date: "2024-04-24", expenses: 387, revenues: 290 },
  { date: "2024-04-25", expenses: 215, revenues: 250 },
  { date: "2024-04-26", expenses: 75, revenues: 130 },
  { date: "2024-04-27", expenses: 383, revenues: 420 },
  { date: "2024-04-28", expenses: 122, revenues: 180 },
  { date: "2024-04-29", expenses: 315, revenues: 240 },
  { date: "2024-04-30", expenses: 454, revenues: 380 },
  { date: "2024-05-01", expenses: 165, revenues: 220 },
  { date: "2024-05-02", expenses: 293, revenues: 310 },
  { date: "2024-05-03", expenses: 247, revenues: 190 },
  { date: "2024-05-04", expenses: 385, revenues: 420 },
  { date: "2024-05-05", expenses: 481, revenues: 390 },
  { date: "2024-05-06", expenses: 498, revenues: 520 },
  { date: "2024-05-07", expenses: 388, revenues: 300 },
  { date: "2024-05-08", expenses: 149, revenues: 210 },
  { date: "2024-05-09", expenses: 227, revenues: 180 },
  { date: "2024-05-10", expenses: 293, revenues: 330 },
  { date: "2024-05-11", expenses: 335, revenues: 270 },
  { date: "2024-05-12", expenses: 197, revenues: 240 },
  { date: "2024-05-13", expenses: 197, revenues: 160 },
  { date: "2024-05-14", expenses: 448, revenues: 490 },
  { date: "2024-05-15", expenses: 473, revenues: 380 },
  { date: "2024-05-16", expenses: 338, revenues: 400 },
  { date: "2024-05-17", expenses: 499, revenues: 420 },
  { date: "2024-05-18", expenses: 315, revenues: 350 },
  { date: "2024-05-19", expenses: 235, revenues: 180 },
  { date: "2024-05-20", expenses: 177, revenues: 230 },
  { date: "2024-05-21", expenses: 82, revenues: 140 },
  { date: "2024-05-22", expenses: 81, revenues: 120 },
  { date: "2024-05-23", expenses: 252, revenues: 290 },
  { date: "2024-05-24", expenses: 294, revenues: 220 },
  { date: "2024-05-25", expenses: 201, revenues: 250 },
  { date: "2024-05-26", expenses: 213, revenues: 170 },
  { date: "2024-05-27", expenses: 420, revenues: 460 },
  { date: "2024-05-28", expenses: 233, revenues: 190 },
  { date: "2024-05-29", expenses: 78, revenues: 130 },
  { date: "2024-05-30", expenses: 340, revenues: 280 },
  { date: "2024-05-31", expenses: 178, revenues: 230 },
  { date: "2024-06-01", expenses: 178, revenues: 200 },
  { date: "2024-06-02", expenses: 470, revenues: 410 },
  { date: "2024-06-03", expenses: 103, revenues: 160 },
  { date: "2024-06-04", expenses: 439, revenues: 380 },
  { date: "2024-06-05", expenses: 88, revenues: 140 },
  { date: "2024-06-06", expenses: 294, revenues: 250 },
  { date: "2024-06-07", expenses: 323, revenues: 370 },
  { date: "2024-06-08", expenses: 385, revenues: 320 },
  { date: "2024-06-09", expenses: 438, revenues: 480 },
  { date: "2024-06-10", expenses: 155, revenues: 200 },
  { date: "2024-06-11", expenses: 92, revenues: 150 },
  { date: "2024-06-12", expenses: 492, revenues: 420 },
  { date: "2024-06-13", expenses: 81, revenues: 130 },
  { date: "2024-06-14", expenses: 426, revenues: 380 },
  { date: "2024-06-15", expenses: 307, revenues: 350 },
  { date: "2024-06-16", expenses: 371, revenues: 310 },
  { date: "2024-06-17", expenses: 475, revenues: 520 },
  { date: "2024-06-18", expenses: 107, revenues: 170 },
  { date: "2024-06-19", expenses: 341, revenues: 290 },
  { date: "2024-06-20", expenses: 408, revenues: 450 },
  { date: "2024-06-21", expenses: 169, revenues: 210 },
  { date: "2024-06-22", expenses: 317, revenues: 270 },
  { date: "2024-06-23", expenses: 480, revenues: 530 },
  { date: "2024-06-24", expenses: 132, revenues: 180 },
  { date: "2024-06-25", expenses: 141, revenues: 190 },
  { date: "2024-06-26", expenses: 434, revenues: 380 },
  { date: "2024-06-27", expenses: 448, revenues: 490 },
  { date: "2024-06-28", expenses: 149, revenues: 200 },
  { date: "2024-06-29", expenses: 103, revenues: 160 },
  { date: "2024-06-30", expenses: 446, revenues: 400 },
]

const chartConfig = {
  amount: {
    label: "Amount",
  },
  expenses: {
    label: "Expenses",
    color: "hsl(255, 75%, 60%)",
  },
  revenues: {
    label: "Revenues",
    color: "hsl(215, 18%, 50%)",
  },
} satisfies ChartConfig

interface ChartAreaInteractiveProps {
  data: { date: string; expenses: number; revenues: number }[];
  title: string;
  description: string;
}

export function ChartAreaInteractive({ data, title, description }: ChartAreaInteractiveProps) {
  const [timeRange, setTimeRange] = React.useState("90d")

  const filteredData = data.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date()
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  return (
    <Card className="pt-0 card-rounded">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>
            {description}
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex select-rounded"
            aria-label="Select a value"
          >
            <SelectValue placeholder="Last 3 months" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="90d" className="rounded-lg">
              Last 3 months
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Last 30 days
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              Last 7 days
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(255, 75%, 60%)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(255, 75%, 60%)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillRevenues" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(215, 18%, 50%)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(215, 18%, 50%)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="hsl(220, 32%, 90%)" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
              className="text-sm"
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="revenues"
              type="natural"
              fill="url(#fillRevenues)"
              stroke="hsl(215, 18%, 50%)"
              stackId="a"
            />
            <Area
              dataKey="expenses"
              type="natural"
              fill="url(#fillExpenses)"
              stroke="hsl(255, 75%, 60%)"
              stackId="a"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}