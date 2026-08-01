import { render, screen } from "@testing-library/react";
import ChartCard from "../../components/ChartCard";

describe("ChartCard", () => {
  it("renders the provided title as a heading", () => {
    render(<ChartCard title="Albums by genre">children-go-here</ChartCard>);
    expect(screen.getByRole("heading", { name: /albums by genre/i })).toBeInTheDocument();
  });

  it("renders a chart wrapper with the chart class", () => {
    const { container } = render(
      <ChartCard title="Top artists">
        <span>Chart content</span>
      </ChartCard>,
    );
    expect(container.querySelector(".chart")).not.toBeNull();
    expect(screen.getByText("Chart content")).toBeInTheDocument();
  });

  it("renders the title for different strings", () => {
    render(<ChartCard title="Release-year distribution"><i /></ChartCard>);
    expect(
      screen.getByRole("heading", { name: /release-year distribution/i }),
    ).toBeInTheDocument();
  });
});
