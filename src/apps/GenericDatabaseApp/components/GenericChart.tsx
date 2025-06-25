import { Paper, Typography } from "@mui/material";
import { FC } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// 共通の型定義をインポート

// グラフデータのエントリ型 (カテゴリとその件数など)
interface ChartDataEntry {
  name: string; // カテゴリ名 (例: '完了', '未完了', 'A', 'B')
  value: number; // 件数
}

// グラフタイプ
type ChartType = "bar" | "pie";

interface GenericChartProps {
  title: string; // グラフのタイトル
  data: ChartDataEntry[]; // グラフ表示用のデータ
  chartType?: ChartType; // グラフの種類 (デフォルトは 'bar')
  dataKey?: string; // 棒グラフ/折れ線グラフで値を表示するデータキー (デフォルトは 'value')
  nameKey?: string; // 棒グラフ/折れ線グラフでカテゴリを表示するデータキー (デフォルトは 'name')
  colors?: string[]; // グラフの色 (円グラフのセクション色など)
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#d0ed57"];

const GenericChart: FC<GenericChartProps> = ({
  title,
  data,
  chartType = "bar",
  dataKey = "value",
  nameKey = "name",
  colors = COLORS,
}) => {
  if (!data || data.length === 0) {
    return (
      <Paper sx={{ p: 2, height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography variant="h6" color="text.secondary">
          表示するデータがありません。
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, height: 300 }}>
      <Typography variant="h6" gutterBottom align="center">
        {title}
      </Typography>
      <ResponsiveContainer width="100%" height="80%">
        {chartType === "bar" ? (
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={nameKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={dataKey} fill={colors[0] || "#8884d8"} />
          </BarChart>
        ) : (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey={dataKey}
              nameKey={nameKey}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} // ラベル表示
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        )}
      </ResponsiveContainer>
    </Paper>
  );
};

export default GenericChart;
