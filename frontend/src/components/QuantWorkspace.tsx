interface Props {
  children: React.ReactNode
}

export default function QuantWorkspace({ children }: Props) {
  return (
    <div className="quant-root">
      <div id="workspace">
        <div id="mainpane">
          {children}
        </div>
      </div>
    </div>
  )
}
