"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "A bar chart"

const chartData = [
  { month: "January", desktop: 186 },
  { month: "February", desktop: 305 },
  { month: "March", desktop: 237 },
  { month: "April", desktop: 73 },
  { month: "May", desktop: 209 },
  { month: "June", desktop: 214 },
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(255, 75%, 60%)",
  },
} satisfies ChartConfig

export function ChartBarDefault() {
  return (
    <Card className="w-full max-w-md card-rounded">
      <CardHeader>
        <CardTitle className="text-xl">Bar Chart</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[150px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} stroke="hsl(220, 32%, 90%)" />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
              className="text-sm"
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="desktop" fill="hsl(255, 75%, 60%)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium text-xs text-violet-600">
          Trending up by 5.2% this month <TrendingUp className="h-3 w-3" />
        </div>
        <div className="text-muted-foreground leading-none text-xs">
          Showing total visitors for the last 6 months
        </div>
      </CardFooter>
    </Card>
  )
}