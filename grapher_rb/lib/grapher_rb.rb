require 'json'

module GrapherRB

  class << self

    def script_contents(graph_options)
      "renderGrapher(#{JSON.dump(graph_options)})"
    end

    def render_raw(graph_options, output_name=nil)
      output_name = 'render.html' if output_name.nil?
      file_contents = File.read(File.join(__dir__, 'index.html')).sub('</body>', "<script>#{script_contents(graph_options)}</script></body>")

      File.write(output_name, file_contents)

      if output_name.include?('..' ) || output_name.include?(';') || output_name.include?('&') || output_name.include?('|') || output_name.include?("\n")
        puts "Output name looks sketchy -- not opening"
        return
      end

      `open #{output_name}`
    end

    def render_series(series, output_name=nil, title: nil)
      render_raw({ series: series, title: title }, output_name)
    end

    def render_line(data, output_name=nil, title: nil)
      render_raw({ series: [{ data: data }], title: title }, output_name)
    end

  end

end