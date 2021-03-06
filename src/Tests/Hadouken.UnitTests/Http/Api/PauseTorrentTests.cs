﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using NUnit.Framework;
using Moq;
using Hadouken.BitTorrent;
using System.IO;
using Hadouken.Impl.Http.Api;
using Hadouken.Http;

namespace Hadouken.UnitTests.Http.Api
{
    [TestFixture]
    public class PauseTorrentTests
    {
        [Test]
        public void Can_pause_torrent()
        {
            var bte = new Mock<IBitTorrentEngine>();
            var man = new Mock<ITorrentManager>();
            var ctx = new Mock<IHttpContext>();
            var rq = new Mock<IHttpRequest>();

            var ms = new MemoryStream();
            var data = Encoding.UTF8.GetBytes("[ \"abc\", \"garbage\" ]");
            ms.Write(data, 0, data.Length);
            ms.Position = 0;

            // Setup
            rq.SetupGet(r => r.InputStream).Returns(ms);
            ctx.SetupGet(c => c.Request).Returns(rq.Object);
            man.SetupGet(m => m.InfoHash).Returns("abc");
            bte.SetupGet(b => b.Managers["abc"]).Returns(man.Object);
            bte.Setup(b => b.Managers.ContainsKey("abc")).Returns(true);

            // Test
            var act = new PauseTorrent(bte.Object);
            act.Context = ctx.Object;
            var result = act.Execute();

            // Verify
            man.Verify(m => m.Pause(), Times.Once());

            // Clean up
            ms.Dispose();
        }
    }
}
