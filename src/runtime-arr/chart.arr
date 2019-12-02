provide *
provide-types *

import global as G
import chart-lib as CL
import either as E
import image as IM
import list as L
import option as O

include from O: type Option end

################################################################################
# CONSTANTS
################################################################################


################################################################################
# TYPE SYNONYMS
################################################################################

type Posn = RawArray<Number>
type TableIntern = RawArray<RawArray<Any>>

################################################################################
# HELPERS
################################################################################

posn = {(x :: Number, y :: Number): [G.raw-array: x, y]}

fun map2(xs :: L.List<Any>, ys :: L.List<Any>):
  L.map2({(x, y): [G.raw-array: x, y]}, xs, ys)
end

fun raw-array-from-list(l :: L.List<Any>) -> RawArray<Any>:
  L.to-raw-array(l)
end

fun to-table2(xs :: L.List<Any>, ys :: L.List<Any>) -> TableIntern:
  L.to-raw-array(L.map2({(x, y): [G.raw-array: x, y]}, xs, ys))
end

fun to-table3(xs :: L.List<Any>, ys :: L.List<Any>, zs :: L.List<Any>) -> TableIntern:
  L.to-raw-array(L.map3({(x, y, z): [G.raw-array: x, y, z]}, xs, ys, zs))
end

# TODO(tiffany): add in get-vs-from-img after VS is implemented

################################################################################
# METHODS
################################################################################


################################################################################
# BOUNDING BOX
################################################################################

type BoundingBox = {
  x-min :: Number,
  x-max :: Number,
  y-min :: Number,
  y-max :: Number,
  is-valid :: Boolean
}

default-bounding-box :: BoundingBox = {
  x-min: 0,
  x-max: 0,
  y-min: 0,
  y-max: 0,
  is-valid: false,
}

fun compute-min(ps :: RawArray<Number>) -> Number:
  G.raw-array-min(ps)
end

fun compute-max(ps :: RawArray<Number>) -> Number:
  G.raw-array-max(ps)
end

fun get-bounding-box(ps :: L.List<Posn>) -> BoundingBox:
  if L.length(ps) == 0:
    default-bounding-box.{is-valid: false}
  else:
    x-arr = G.raw-array-get(ps, 0)
    y-arr = G.raw-array-get(ps, 1)
    default-bounding-box.{
      x-min: compute-min(x-arr),
      x-max: compute-max(x-arr),
      y-min: compute-min(y-arr),
      y-max: compute-max(y-arr),
      is-valid: true,
    }
  end
end

fun merge-bounding-box(bs :: L.List<BoundingBox>) -> BoundingBox:
  for L.fold(prev from default-bounding-box, e from bs):
    ask:
      | e.is-valid and prev.is-valid then:
        default-bounding-box.{
          x-min: G.num-min(e.x-min, prev.x-min),
          x-max: G.num-max(e.x-max, prev.x-max),
          y-min: G.num-min(e.y-min, prev.y-min),
          y-max: G.num-max(e.y-max, prev.y-max),
          is-valid: true,
        }
      | e.is-valid then: e
      | prev.is-valid then: prev
      | otherwise: default-bounding-box
    end
  end
end

################################################################################
# DEFAULT VALUES
################################################################################

type PieChartSeries = {
  tab :: TableIntern,
}

default-pie-chart-series = {}

type BarChartSeries = {
  tab :: TableIntern,
  legends :: RawArray<String>,
  has-legend :: Boolean,
}

default-bar-chart-series = {}

type ScatterPlotSeries = {
  ps :: L.List<Posn>,
  color :: Option<IM.Color>,
  legend :: String,
  point-size :: Number,
}

default-scatter-plot-series = {
  color: none,
  legend: '',
  point-size: 7,
}

###########

type ChartWindowObject = {
  title :: String,
  width :: Number,
  height :: Number,
  render :: ( -> IM.Image)
}

default-chart-window-object :: ChartWindowObject = {
  title: '',
  width: 800,
  height: 600,
  render: method(self): G.raise('unimplemented') end,
}

type PieChartWindowObject = {
  title :: String,
  width :: Number,
  height :: Number,
  render :: ( -> IM.Image),
}

default-pie-chart-window-object :: PieChartWindowObject = default-chart-window-object

type BarChartWindowObject = {
  title :: String,
  width :: Number,
  height :: Number,
  render :: ( -> IM.Image),
  x-axis :: String,
  y-axis :: String,
  y-min :: O.Option<Number>,
  y-max :: O.Option<Number>,
}

default-bar-chart-window-object :: BarChartWindowObject = default-chart-window-object.{
  x-axis: '',
  y-axis: '',
  y-min: O.none,
  y-max: O.none,
}

type PlotChartWindowObject = {
  title :: String,
  width :: Number,
  height :: Number,
  render :: ( -> IM.Image),
  x-axis :: String,
  y-axis :: String,
  x-min :: Option<Number>,
  x-max :: Option<Number>,
  x-max :: Option<Number>,
  y-max :: Option<Number>,
  num-samples :: Number,
}

default-plot-chart-window-object :: PlotChartWindowObject = default-chart-window-object.{
  x-axis: '',
  y-axis: '',
  x-min: none,
  x-max: none,
  y-min: none,
  y-max: none,
  num-samples: 1000,
}

################################################################################
# DATA DEFINITIONS
################################################################################

data DataSeries:
  | scatter-plot-series(obj :: ScatterPlotSeries) with:
    is-single: false,
    color: method(self, color :: I.Color):
      scatter-plot-series(self.obj.{color: some(color)})
    end,
    legend: method(self, legend :: String):
      scatter-plot-series(self.obj.{legend: legend})
    end,
    point-size: method(self, point-size :: Number):
      scatter-plot-series(self.obj.{point-size: point-size})
    end,
  | pie-chart-series(obj :: PieChartSeries) with:
    is-single: true,
  | bar-chart-series(obj :: BarChartSeries) with:
    is-single: true,
# TODO(tiffany): add _output and test get-vs-from-img after VS is implemented
end

fun check-chart-window(p :: ChartWindowObject) -> Nothing:
  if (p.width <= 0) or (p.height <= 0):
    G.raise('render: width and height must be positive')
  else:
    G.nothing
  end
end

data ChartWindow:
  | pie-chart-window(obj :: PieChartWindowObject) with:
    #constr: {(): pie-chart-window},
    title: method(self, title :: String): pie-chart-window(self.obj.{title: title}) end,
    width: method(self, width :: Number): pie-chart-window(self.obj.{width: width}) end,
    height: method(self, height :: Number): pie-chart-window(self.obj.{height: height}) end,
    display: method(self):
      _ = check-chart-window(self.obj)
      self.obj.{interact: true}.render()
    end,
    get-image: method(self):
      _ = check-chart-window(self.obj)
      self.obj.{interact: false}.render()
    end,
  | bar-chart-window(obj :: BarChartWindowObject) with:
    #constr: {(): bar-chart-window},
    x-axis: method(self, x-axis :: String): bar-chart-window(self.obj.{x-axis: x-axis}) end,
    y-axis: method(self, y-axis :: String): bar-chart-window(self.obj.{y-axis: y-axis}) end,
    y-min: method(self, y-min :: Number): bar-chart-window(self.obj.{y-min: O.some(y-min)}) end,
    y-max: method(self, y-max :: Number): bar-chart-window(self.obj.{y-max: O.some(y-max)}) end,
    title: method(self, title :: String): bar-chart-window(self.obj.{title: title}) end,
    width: method(self, width :: Number): bar-chart-window(self.obj.{width: width}) end,
    height: method(self, height :: Number): bar-chart-window(self.obj.{height: height}) end,
    display: method(self):
      _ = check-chart-window(self.obj)
      self.obj.{interact: true}.render()
    end,
    get-image: method(self):
      _ = check-chart-window(self.obj)
      self.obj.{interact: false}.render()
    end,
#sharing:

  # TODO(tiffany): add the following 3 methods to every ChartWindow
  # title: method(self, title :: String): self.constr()(self.obj.{title: title}) end,
  # width: method(self, width :: Number): self.constr()(self.obj.{width: width}) end,
  # height: method(self, height :: Number): self.constr()(self.obj.{height: height}) end,
  # display: method(self):
  #   _ = check-chart-window(self.obj)
  #   self.obj.{interact: true}.render()
  # end,
  # get-image: method(self):
  #   _ = check-chart-window(self.obj)
  #   self.obj.{interact: false}.render()
  # end,
  
  # TODO(tiffany): add _output and test get-vs-from-img after VS is implemented
end

################################################################################
# FUNCTIONS
################################################################################

fun pie-chart-from-list(labels :: L.List<String>, values :: L.List<Number>) -> DataSeries block:
  doc: ```
       Consume labels, a list of string, and values, a list of numbers
       and construct a pie chart
       ```
  label-length = L.length(labels)
  value-length = L.length(values)
  when label-length <> value-length:
    G.raise('pie-chart: labels and values should have the same length')
  end
  when label-length == 0:
    G.raise('pie-chart: need at least one data')
  end
  # TODO(tiffany): uncomment after implementing each
  #values.each(check-num)
  #labels.each(check-string)
  pie-chart-series(default-pie-chart-series.{
    tab: to-table2(labels, values)
  })
end

fun bar-chart-from-list(labels :: L.List<String>, values :: L.List<Number>) -> DataSeries block:
  doc: ```
       Consume labels, a list of string, and values, a list of numbers
       and construct a bar chart
       ```
  label-length = L.length(labels)
  value-length = L.length(values)
  when label-length <> value-length:
    G.raise('bar-chart: labels and values should have the same length')
  end
  # TODO(tiffany): uncomment after implementing each
  #values.each(check-num)
  #labels.each(check-string)
  bar-chart-series(default-bar-chart-series.{
    tab: to-table2(labels, values),
    legends: [G.raw-array: ''],
    has-legend: false,
  })
end

################################################################################
# PLOTS
################################################################################

fun render-chart(s :: DataSeries) -> ChartWindow:
  doc: 'Render it!'
  cases (DataSeries) s:
    | pie-chart-series(obj) =>
      pie-chart-window(default-pie-chart-window-object.{
        render: method(self): CL.pie-chart(obj.tab) end
      })
    | bar-chart-series(obj) =>
      bar-chart-window(default-bar-chart-window-object.{
        render: method(self):
          _ = cases (Option) self.y-min:
                | some(y-min) =>
                  cases (Option) self.y-max:
                    | some(y-max) =>
                      if y-min >= y-max:
                        G.raise("render: y-min must be strictly less than y-max")
                      else:
                        G.nothing
                      end
                    | else => G.nothing
                  end
                | else => G.nothing
              end
          CL.bar-chart(obj.tab)
        end
      })
  end
#where:
#  render-now = {(x): render-chart(x).get-image()}
end
