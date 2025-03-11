require_relative 'lib/grapher_rb'

GrapherRB.render_raw({
                         series: [
                             {
                                 data: [
                                     0, 1, 2, 3, 3, 2, 5
                                 ]
                             }
                         ]
                     })
