# Add charts — data from hidden sheet ChartData
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$path = if ($env:KE_HOACH_OUT) {
  (Resolve-Path $env:KE_HOACH_OUT).Path
} else {
  $main = Join-Path $root 'NguyenTrieuGiaKhanh_KeHoach_6Tuan_IOC.xlsx'
  $newPath = Join-Path $root 'NguyenTrieuGiaKhanh_KeHoach_6Tuan_IOC_new.xlsx'
  if ((Test-Path $main) -and (Test-Path $newPath)) {
    if ((Get-Item $main).LastWriteTime -ge (Get-Item $newPath).LastWriteTime) {
      Remove-Item $newPath -Force -ErrorAction SilentlyContinue
      $main
    } else { $newPath }
  } elseif (Test-Path $newPath) { $newPath }
  elseif (Test-Path $main) { $main }
  else { throw "Excel file not found" }
}

$configPath = Join-Path $PSScriptRoot 'ke-hoach-charts.json'
$config = Get-Content $configPath -Raw -Encoding UTF8 | ConvertFrom-Json
$dataSheet = 'ChartData'

function RGB($r, $g, $b) { return $r + ($g * 256) + ($b * 65536) }

function Remove-AllCharts($ws) {
  while ($ws.ChartObjects().Count -gt 0) {
    $ws.ChartObjects().Item(1).Delete()
  }
}

function Set-SeriesColors($chart, $colors) {
  if (-not $colors) { return }
  $count = $chart.SeriesCollection().Count
  for ($i = 1; $i -le $count; $i++) {
    $idx = [Math]::Min($i, $colors.Count) - 1
    if ($idx -lt 0) { continue }
    $c = $colors[$idx]
    $series = $chart.SeriesCollection($i)
    try {
      $series.Format.Fill.Visible = -1
      $series.Format.Fill.ForeColor.RGB = RGB $c[0] $c[1] $c[2]
    } catch {
      $series.Interior.Color = RGB $c[0] $c[1] $c[2]
    }
  }
  if ($chart.ChartType -eq 5 -and $count -ge 1) {
    $series = $chart.SeriesCollection(1)
    $pts = $series.Points().Count
    for ($p = 1; $p -le $pts; $p++) {
      $ci = [Math]::Min($p - 1, $colors.Count - 1)
      if ($ci -ge 0) {
        $c = $colors[$ci]
        try { $series.Points($p).Format.Fill.ForeColor.RGB = RGB $c[0] $c[1] $c[2] } catch { }
      }
    }
  }
}

function Add-Charts($ws, $dataWs, $specs) {
  foreach ($spec in $specs) {
    $chartType = switch ($spec.type) {
      'pie' { 5 }
      'column' { 51 }
      'columnStacked' { 52 }
      'bar' { 57 }
      default { 51 }
    }

    $co = $ws.ChartObjects().Add([double]$spec.left, [double]$spec.top, [double]$spec.w, [double]$spec.h)
    $chart = $co.Chart
    $chart.ChartType = $chartType
    $src = $dataWs.Range($spec.range)
    $chart.SetSourceData($src)
    $chart.HasTitle = $true
    $chart.ChartTitle.Text = $spec.title
    $chart.HasLegend = $true
    $chart.ChartArea.Format.Fill.ForeColor.RGB = RGB 255 255 255
    $chart.PlotArea.Format.Fill.ForeColor.RGB = RGB 255 255 255
    Set-SeriesColors $chart $spec.seriesColors
  }
}

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$wb = $excel.Workbooks.Open((Resolve-Path $path).Path)
$dataWs = $wb.Worksheets.Item($dataSheet)

foreach ($ws in $wb.Worksheets) {
  if ($ws.Name -eq $dataSheet) { continue }
  Remove-AllCharts $ws
  $entry = $config | Where-Object { $ws.Name -like "*$($_.sheetMatch)*" } | Select-Object -First 1
  if ($entry) { Add-Charts $ws $dataWs $entry.charts }
}

$wb.Save()
$wb.Close($false)
$excel.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
Write-Host "Charts added: $path"
