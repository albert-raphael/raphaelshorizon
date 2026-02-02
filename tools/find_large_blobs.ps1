$threshold = 5*1024*1024 # 5 MB
foreach ($line in (git rev-list --objects --all)) {
  $parts = $line -split ' ',2
  if ($parts.Length -ne 2) { continue }
  $sha = $parts[0]
  $path = $parts[1]
  $sizeStr = git cat-file -s $sha 2>$null
  if ($sizeStr -and [int]$sizeStr -gt $threshold) {
    Write-Output "$sha`t$sizeStr`t$path"
  }
}
