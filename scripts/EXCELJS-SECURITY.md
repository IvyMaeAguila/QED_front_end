# ExcelJS browser security backport

ExcelJS 4.4.0 prepackages UUID 8.3.2 in its browser distributions. The scoped UUID 11.1.1 override fixes the installed Node dependency; it does not replace bundled browser code. QED therefore backports the tested output-buffer bounds checks into the pinned unminified and minified browser artifacts.

Run npm ci normally. postinstall applies the deterministic patch; predev/prebuild also verify it, including installations that skipped lifecycle scripts. The patch uses only Node built-ins, verifies both input hashes and all output hashes before writes, accepts already patched bytes, and rejects unknown versions or mixed states. Never bypass a failed checksum after an ExcelJS upgrade. Review and replace this patch when a supported upstream fixed artifact is available.

The manifest stores exact upstream positions and inserted guards. Original sourceMappingURL comments are removed because upstream maps describe different code; unmodified .map files remain unused. The production build does not emit source maps. If maps are enabled later, regenerate them from a reviewed source build; do not advertise stale maps.

MIT notices for ExcelJS and both UUID implementations ship at public/vendor-notices/ExcelJS-UUID-MIT.txt and are verified in dist. Preserve these notices when redistributing. This local backport is not an upstream ExcelJS release.

Regression commands: npm run test:exceljs-security; npm run build. The build guard executes the actual emitted ExcelJS chunk and checks invalid writes fail without modifying buffers. The broader security suite checks v1/v3/v4/v5 invalid and valid offsets, sentinels, API shape and workbook UUID reachability. Test fixtures are retained rather than recursively cleaned up.

Advisory: https://github.com/advisories/GHSA-w5hq-g745-h8pq
Verified isolated investigation: 238 scoped passing executions before integration. Current QED UUID calls are zero-argument v4 conditional-formatting identifiers; no affected caller-buffer path was found through current application usage. This patch is defense in depth, not evidence of a demonstrated application exploit.
