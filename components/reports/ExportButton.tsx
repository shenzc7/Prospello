'use client'

import React from 'react'
import { Download } from 'lucide-react'
import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Objective } from '@/hooks/useObjectives'
import { calculateKRProgress } from '@/lib/utils'

interface ExportButtonProps {
    data: Objective[]
    filename?: string
}

export function ExportButton({ data, filename = 'okr-report' }: ExportButtonProps) {
    const formatPercent = (value: number) => `${Math.round(value)}%`

    const handleExportPDF = () => {
        const doc = new jsPDF()

        doc.setFontSize(20)
        doc.text('OKR Report', 14, 20)

        doc.setFontSize(10)
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30)

        let y = 40

        data.forEach((obj, i) => {
            // Add page if near bottom
            if (y > 270) {
                doc.addPage()
                y = 20
            }

            doc.setFontSize(12)
            doc.setFont('helvetica', 'bold')
            doc.text(`${i + 1}. ${obj.title}`, 14, y)
            y += 7

            doc.setFontSize(10)
            doc.setFont('helvetica', 'normal')
            doc.text(`Status: ${obj.status} | Progress: ${obj.progress}% | Owner: ${obj.owner.name}`, 14, y)
            y += 7

            if (obj.keyResults?.length) {
                obj.keyResults.forEach((kr) => {
                    const progress = calculateKRProgress(kr.current, kr.target)
                    doc.text(
                      `- ${kr.title} • weight ${kr.weight}% • ${kr.current}/${kr.target} (${progress}%)`,
                      20,
                      y
                    )
                    y += 5
                })
            }
            y += 5
        })

        doc.save(`${filename}.pdf`)
    }

    const handleExportExcel = () => {
        const flattenedData = data.map(obj => ({
            Title: obj.title,
            Description: obj.description || '',
            Owner: obj.owner.name,
            Status: obj.status,
            Progress: formatPercent(obj.progress),
            Cycle: obj.cycle,
            Start: new Date(obj.startAt).toLocaleDateString(),
            End: new Date(obj.endAt).toLocaleDateString(),
            KeyResults: obj.keyResults?.map(kr => {
                const progress = calculateKRProgress(kr.current, kr.target)
                return `${kr.title} (weight ${kr.weight}% • ${kr.current}/${kr.target} • ${progress}%)`
            }).join('; ')
        }))

        const ws = XLSX.utils.json_to_sheet(flattenedData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'OKRs')
        XLSX.writeFile(wb, `${filename}.xlsx`)
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportPDF}>
                    Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportExcel}>
                    Export as Excel
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
