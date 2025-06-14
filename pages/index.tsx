import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [mode, setMode] = useState(0);
  const [data, setData] = useState<any[]>([]);

  const filterByHourRanges = () => {
    const now = Math.floor(Date.now() / 1000); // 현재 시간 (초)
    const oneHourAgo = now - 3600;
    const twoHoursAgo = now - 7200;

    const last1Hour = data.filter((item) => item.Timestamp >= oneHourAgo && item.Timestamp <= now);
    const last2to1Hour = data.filter((item) => item.Timestamp >= twoHoursAgo && item.Timestamp < oneHourAgo);

    return { last1Hour, last2to1Hour };
  };
  const filterByDayRanges = () => {
    const now = Math.floor(Date.now() / 1000);
    const oneDayAgo = now - 86400;
    const twoDaysAgo = now - 2 * 86400;

    const last1Day = data.filter((item) => item.Timestamp >= oneDayAgo && item.Timestamp <= now);
    const last2to1Day = data.filter((item) => item.Timestamp >= twoDaysAgo && item.Timestamp < oneDayAgo);

    return { last1Day, last2to1Day };
  };

  const getRate = () => {
    const result = mode === 0 ? filterByHourRanges() : filterByDayRanges();
    const isHour = "last1Hour" in result;

    const data = isHour ? result.last1Hour : result.last1Day;

    const bids = data.reduce((sum, item) => sum + item.Bids, 0);
    const points = data.reduce((sum, item) => sum + item.Points_Pool, 0);

    return { bids, points };
  };

  const getChangeRate = () => {
    const result = mode === 0 ? filterByHourRanges() : filterByDayRanges();

    const isHour = "last1Hour" in result;

    const current = isHour ? result.last1Hour : result.last1Day;
    const previous = isHour ? result.last2to1Hour : result.last2to1Day;

    const sum = (arr: any[], key: string) => arr.reduce((acc, item) => acc + (item[key] || 0), 0);

    const bids1 = sum(current, "Bids");
    const bids2 = sum(previous, "Bids");
    const points1 = sum(current, "Points_Pool");
    const points2 = sum(previous, "Points_Pool");

    const calcRate = (a: number, b: number) => (b === 0 ? (a === 0 ? 0 : Infinity) : ((a - b) / b) * 100);

    return {
      bidsRate: calcRate(bids1, bids2),
      pointsRate: calcRate(points1, points2),
    };
  };

  const toUtcTime = (ts: number) => {
    const date = new Date(ts * 1000);

    const day = date.getUTCDate().toString().padStart(2, "0");
    const hour = date.getUTCHours().toString().padStart(2, "0");
    const minute = date.getUTCMinutes().toString().padStart(2, "0");

    return `${day}:${hour}:${minute}`;
  };

  const convertTimestampsToUnix = (arr: any[]) =>
    arr.map((item) => ({
      ...item,
      Timestamp: Math.floor(new Date(item.Timestamp).getTime() / 1000),
    }));

  const getData = async () => {
    try {
      const res = await fetch("https://data.spone.fun/search?sort=kesoonho&id=data");
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      console.log(data);
      setData(convertTimestampsToUnix(data[0].data.stage2));
    } catch (err) {
      console.error("Fetch error:", err);
      setData([]);
    }
  };

  useEffect(() => {
    // setData(convertTimestampsToUnix(testdata));
    // console.log(convertTimestampsToUnix(testdata));
    getData();
  }, []);

  return (
    <div className={`h-dvh w-dvw`}>
      <main className="flex h-full w-full flex-col gap-2 overflow-y-scroll p-2">
        {data.length <= 0 ? (
          <span>Loading...</span>
        ) : (
          <>
            <div className={`font-key flex h-12 w-full items-center justify-between rounded-xl border border-black px-4`}>
              <div className={`flex h-full items-center gap-4`}>
                <Image src="/slogo.svg" width={30} height={30} alt="logo" />
                <span className="text-xl">Succinct</span>
              </div>
              <Link href={"https://x.com/kesoonho"}>X: @kesoonho</Link>
            </div>

            <div className={`font-key flex flex-col gap-1 rounded-xl border p-4`}>
              <div className={`flex h-8 w-full items-center gap-2 rounded-xl px-2`}>
                <button onClick={() => setMode(0)} className={`${mode === 0 ? "text-pink-400" : "text-black"} cursor-pointer`}>
                  Hourly
                </button>
                <button onClick={() => setMode(1)} className={`${mode === 1 ? "text-pink-400" : "text-black"} cursor-pointer`}>
                  Daily
                </button>
              </div>

              <div className={`grid h-16 w-full grid-cols-2 gap-2 overflow-x-scroll rounded-xl border px-2 break-keep`}>
                <div className={`flex h-full w-full items-center justify-start gap-4 text-xs md:text-base`}>
                  <div className={`flex w-12 flex-col items-center`}>
                    <span>Bids</span>
                    <span>({mode === 0 ? "1h" : "24h"})</span>
                  </div>
                  <span>{getRate().bids}</span>
                  <span className={`${getChangeRate().bidsRate >= 0 ? "text-green-600" : "text-red-600"}`}>{`${getChangeRate().bidsRate.toFixed(2)}%`}</span>
                </div>

                <div className={`flex h-full w-full items-center justify-start gap-4 text-xs md:text-base`}>
                  <div className={`flex w-12 flex-col items-center`}>
                    <span>Points</span>
                    <span>({mode === 0 ? "1h" : "24h"})</span>
                  </div>
                  <span>{getRate().points}</span>
                  <span className={`${getChangeRate().pointsRate >= 0 ? "text-green-600" : "text-red-600"}`}>{`${getChangeRate().pointsRate.toFixed(2)}%`}</span>
                </div>
              </div>
            </div>

            <div className={`font-key w-full rounded-xl border p-2`}>
              <div className={`flex h-8 w-full items-center gap-2 rounded-xl px-2`}>
                <span>Last 5 Contest</span>
              </div>
              <div className={`flex h-fit w-full flex-col rounded-xl border px-2 text-xs md:text-base`}>
                <div className={`grid w-full grid-cols-5 place-items-center`}>
                  <span>Time</span>
                  <span className={`text-green-400`}>Bids</span>
                  <span className={`text-pink-400`}>Stars</span>
                  <span className={`text-yellow-400`}>Multiplier</span>
                  <span className={`text-red-400`}>Prize</span>
                </div>
                <hr></hr>
                <div className={`flex h-52 flex-col overflow-y-scroll`}>
                  {data
                    .slice()
                    .reverse()
                    .map((item, index) => {
                      return (
                        <div key={index} className={`grid w-full grid-cols-5 place-items-center`}>
                          <span>{`[${toUtcTime(item.Timestamp)}]`}</span>
                          <span className={`text-green-400`}>{item.Bids}</span>
                          <span className={`text-pink-400`}>{item.Star_Pool}</span>
                          <span className={`text-yellow-400`}>{item.Multiplier}</span>
                          <span className={`text-red-400`}>{item.Prize}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
