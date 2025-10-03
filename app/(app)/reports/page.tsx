'use client'

import { useState } from 'react'
import { Download, FileText, FileSpreadsheet, TrendingUp, Calendar, Target } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

function ExportSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Reports</CardTitle>
        <CardDescription>Download OKR reports in various formats</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            PDF Report
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Excel Export
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function TrendAnalysis() {
  const trends = [
    {
      period: 'Q4 2024',
      completion: 78,
      trend: '+5%',
      color: 'text-green-600'
    },
    {
      period: 'Q3 2024',
      completion: 73,
      trend: '+12%',
      color: 'text-green-600'
    },
    {
      period: 'Q2 2024',
      completion: 61,
      trend: '-3%',
      color: 'text-red-600'
    },
    {
      period: 'Q1 2024',
      completion: 64,
      trend: '+8%',
      color: 'text-green-600'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          OKR Completion Trends
        </CardTitle>
        <CardDescription>Historical completion rates by quarter</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {trends.map((trend) => (
            <div key={trend.period} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-sm font-medium">{trend.period}</div>
                <Badge variant="outline">{trend.completion}%</Badge>
              </div>
              <div className={`text-sm font-medium ${trend.color}`}>
                {trend.trend}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

type TreeNodeType = {
  name: string
  progress: number
  children?: TreeNodeType[]
}

function AlignmentVisualization() {
  // Mock tree data - in a real implementation, this would come from the API
  const treeData = {
    company: {
      name: "Achieve 99.9% Platform Uptime",
      progress: 85,
      children: [
        {
          name: "Engineering Team: Improve API Response Time",
          progress: 78,
          children: [
            { name: "John: Optimize Database Queries", progress: 92 },
            { name: "Sarah: Implement Caching Layer", progress: 85 },
          ]
        },
        {
          name: "DevOps Team: Enhance Monitoring",
          progress: 90,
          children: [
            { name: "Mike: Set Up Alert System", progress: 95 },
            { name: "Lisa: Implement Auto-scaling", progress: 88 },
          ]
        }
      ]
    }
  }

  const TreeNode = ({ node, level = 0 }: { node: TreeNodeType; level?: number }) => (
    <div className={`${level > 0 ? 'ml-6 border-l border-muted pl-4' : ''}`}>
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 mb-2">
        <div className={`w-3 h-3 rounded-full ${
          node.progress >= 80 ? 'bg-green-500' :
          node.progress >= 60 ? 'bg-yellow-500' : 'bg-red-500'
        }`} />
        <div className="flex-1">
          <p className="font-medium text-sm">{node.name}</p>
          <p className="text-xs text-muted-foreground">{node.progress}% complete</p>
        </div>
      </div>
      {node.children && node.children.map((child: TreeNodeType, index: number) => (
        <TreeNode key={index} node={child} level={level + 1} />
      ))}
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Alignment Overview
        </CardTitle>
        <CardDescription>Goal cascade from company to individual level</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <TreeNode node={treeData.company} />
        </div>
        <div className="mt-6 p-4 bg-muted/20 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Legend:</strong> Green ≥80%, Yellow 60-79%, Red &lt;60%
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Expand objectives to see how goals cascade from company → team → individual level
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function CompletionAnalytics() {
  const analytics = [
    { label: 'Total Objectives', value: '47', change: '+12%' },
    { label: 'Completed This Quarter', value: '23', change: '+8%' },
    { label: 'Average Completion Time', value: '6.2 weeks', change: '-2 days' },
    { label: 'On-Time Delivery Rate', value: '78%', change: '+5%' }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {analytics.map((item) => (
        <Card key={item.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
            <p className="text-xs text-muted-foreground">{item.change} from last quarter</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function ReportsPage() {
  const [selectedQuarter, setSelectedQuarter] = useState('Q4-2024')

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground">
            Track progress, analyze trends, and export OKR reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Q4-2024">Q4 2024</SelectItem>
              <SelectItem value="Q3-2024">Q3 2024</SelectItem>
              <SelectItem value="Q2-2024">Q2 2024</SelectItem>
              <SelectItem value="Q1-2024">Q1 2024</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Analytics Overview */}
      <CompletionAnalytics />

      {/* Main Content */}
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList>
          <TabsTrigger value="trends">Trend Analysis</TabsTrigger>
          <TabsTrigger value="alignment">Alignment</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <TrendAnalysis />
        </TabsContent>

        <TabsContent value="alignment" className="space-y-6">
          <AlignmentVisualization />
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <ExportSection />
        </TabsContent>
      </Tabs>
    </div>
  )
}
