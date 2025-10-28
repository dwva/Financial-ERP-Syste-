"use client"

import { TrendingUp } from "lucide-react"
import { Pie, PieChart, Cell } from "recharts"

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

interface ChartPieSimpleProps {
  data: { name: string; value: number; fill?: string }[];
  title: string;
  description: string;
}

export const description = "A simple pie chart"

const chartConfig = {
  value: {
    label: "Value",
  },
} satisfies ChartConfig

export function ChartPieSimple({ data, title, description }: ChartPieSimpleProps) {
  // Default colors with violet as primary color
  const COLORS = ["hsl(255, 75%, 60%)", "hsl(255, 70%, 70%)", "hsl(255, 65%, 80%)", "hsl(220, 32%, 90%)", "hsl(215, 18%, 50%)"];
  
  const dataWithColors = data.map((item, index) => ({
    ...item,
    fill: item.fill || COLORS[index % COLORS.length]
  }));

  return (
    <Card className="flex flex-col card-rounded">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="text-center">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie 
              data={dataWithColors} 
              dataKey="value" 
              nameKey="name" 
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {dataWithColors.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium text-violet-600">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing total visitors for the last 6 months
        </div>
      </CardFooter>
    </Card>
  )
}